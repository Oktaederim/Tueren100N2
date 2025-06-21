// JavaScript-Logik für den Rechner
document.addEventListener('DOMContentLoaded', () => {
    // Elemente der Benutzeroberfläche abrufen
    const doorWidthSlider = document.getElementById('doorWidthSlider');
    const doorWidthInput = document.getElementById('doorWidth');
    const doorHeightSlider = document.getElementById('doorHeightSlider');
    const doorHeightInput = document.getElementById('doorHeight');
    const differentialPressureSlider = document.getElementById('differentialPressureSlider');
    const differentialPressureInput = document.getElementById('differentialPressure');
    const doorCloserMomentSlider = document.getElementById('doorCloserMomentSlider');
    const doorCloserMomentInput = document.getElementById('doorCloserMoment');
    const b2DistanceSlider = document.getElementById('b2DistanceSlider'); // Neuer b2 Slider
    const b2DistanceInput = document.getElementById('b2Distance');     // Neues b2 Input
    const volumeFlowSlider = document.getElementById('volumeFlowSlider');
    const volumeFlowInput = document.getElementById('volumeFlow');
    const resetButton = document.getElementById('resetButton'); // Reset Button

    const roomTypeRadios = document.querySelectorAll('input[name="roomType"]');

    const doorAreaResult = document.getElementById('doorAreaResult');
    const displayDifferentialPressureResult = document.getElementById('displayDifferentialPressureResult');
    const operatingForceDisplay = document.getElementById('operatingForceDisplay');
    const operatingForceResult = document.getElementById('operatingForceResult');
    const doorCloserForceContribution = document.getElementById('doorCloserForceContribution'); // Neues Element für Türschließer-Anteil
    const operatingForceStatus = document.getElementById('operatingForceStatus');
    const airflowVelocityDisplay = document.getElementById('airflowVelocityDisplay');
    const airflowVelocityResult = document.getElementById('airflowVelocityResult');
    const airflowVelocityStatus = document.getElementById('airflowVelocityStatus');
    const volumeFlowHourResult = document.getElementById('volumeFlowHourResult'); // Neues Element für m³/h


    // Speichern der Standardwerte
    const defaultValues = {
        doorWidth: "1.00", // Türbreite 1 m
        doorHeight: "2.20", // Türhöhe 2,20 m
        differentialPressure: "50", // Differenzdruck 50 Pa
        doorCloserMoment: "22.5", // Türschließermoment 22,5 Nm
        b2Distance: "0.94", // Abstand zur Drehachse b2 0,94 m
        volumeFlow: "2.0", // Volumenstrom 2,0 m³/s
        roomType: "Sicherheitstreppenraum"
    };


    // Hauptfunktion zur Aktualisierung der Berechnungen und Anzeigen
    const updateCalculations = () => {
        // Eingabewerte abrufen (als Zahlen parsen)
        const B = parseFloat(doorWidthInput.value); // Türbreite
        const H = parseFloat(doorHeightInput.value); // Türhöhe
        const deltaP = parseFloat(differentialPressureInput.value); // Differenzdruck
        const M0 = parseFloat(doorCloserMomentInput.value); // Türschließer-Moment
        let b2 = parseFloat(b2DistanceInput.value);      // Abstand b2 (Türgriff zu Drehachse)
        const Q_s = parseFloat(volumeFlowInput.value); // Volumenstrom in m³/s

        // --- Validierung für b2 ---
        // b2 muss kleiner als B sein. Mindestabstand 0.01m zur Türbreite, um phys. Sinn zu erhalten und Div/0 zu vermeiden
        const maxB2 = B - 0.01; 
        if (b2 >= B) { // If b2 is greater than or equal to B
            b2 = maxB2; // Cap b2 at max allowed value
            b2DistanceInput.value = b2.toFixed(2); // Update input field
            b2DistanceSlider.value = b2.toFixed(2); // Update slider
            console.warn("b2 wurde auf max. zulässigen Wert (Türbreite - 0.01m) begrenzt.");
        }
        // Also ensure b2 is not less than its min allowed, which is 0.01
        if (b2 < 0.01) {
            b2 = 0.01;
            b2DistanceInput.value = b2.toFixed(2);
            b2DistanceSlider.value = b2.toFixed(2);
            console.warn("b2 wurde auf min. zulässigen Wert (0.01m) begrenzt.");
        }


        // Türfläche (A = B * H)
        const A = B * H;
        doorAreaResult.textContent = A.toFixed(2); // Auf 2 Dezimalstellen runden

        // Anzeige des aktuellen Differenzdrucks
        displayDifferentialPressureResult.textContent = deltaP.toFixed(0);

        // Berechnete Betätigungskraft (F_T)
        // b1 = B/2 (Abstand Drehpunkt zu Kraftangriffspunkt - Mitte Türfläche)
        const b1 = B / 2;
        
        let FT_numerator = (deltaP * A * b1 + M0);
        let FT = 0;
        let F_Mo_contribution = 0; // Anteil des Türschließers in N

        if (b2 > 0) { // Division durch Null vermeiden (sollte durch b2 validation oben abgedeckt sein, aber doppelt hält besser)
            FT = FT_numerator / b2;
            F_Mo_contribution = M0 / b2;
        } else {
            FT = 0; // oder ein geeigneter Fehlerwert
            F_Mo_contribution = 0;
            console.warn("b2 ist Null oder negativ, kann nicht durch Null teilen. FT und F_Mo_contribution auf 0 gesetzt.");
        }
        
        // Sicherstellen, dass FT nicht negativ wird, falls M0 zu klein ist und deltaP 0 ist (unwahrscheinlich, aber für Robustheit)
        if (FT < 0) FT = 0;

        operatingForceResult.textContent = FT.toFixed(2);
        doorCloserForceContribution.textContent = `(davon Türschließer: ${F_Mo_contribution.toFixed(2)} N)`;


        // Farbliche Kennzeichnung und Status für Betätigungskraft
        operatingForceDisplay.classList.remove('bg-ok', 'bg-danger');
        operatingForceResult.classList.remove('text-ok', 'text-danger');
        operatingForceStatus.classList.remove('text-ok', 'text-danger');

        if (FT <= 100) {
            operatingForceDisplay.classList.add('bg-ok');
            operatingForceResult.classList.add('text-ok');
            operatingForceStatus.classList.add('text-ok');
            operatingForceStatus.textContent = 'Status: OK (≤ 100 N)';
        } else {
            operatingForceDisplay.classList.add('bg-danger');
            operatingForceResult.classList.add('text-danger');
            operatingForceStatus.classList.add('text-danger');
            operatingForceStatus.textContent = 'Status: NICHT OK (> 100 N)! Erhöhte Betätigungskraft.';
        }

        // Berechnete Durchströmungsgeschwindigkeit (v = Q / A)
        let v = 0;
        if (A > 0) { // Division durch Null vermeiden
            v = Q_s / A;
        }
        airflowVelocityResult.textContent = v.toFixed(2);

        // Durchströmungsvolumen in m³/h
        const Q_h = Q_s * 3600;
        volumeFlowHourResult.textContent = Q_h.toFixed(2);


        // Farbliche Kennzeichnung und Status für Durchströmungsgeschwindigkeit
        airflowVelocityDisplay.classList.remove('bg-ok', 'bg-warning', 'bg-danger');
        airflowVelocityResult.classList.remove('text-ok', 'text-warning', 'text-danger');
        airflowVelocityStatus.classList.remove('text-ok', 'text-warning', 'text-danger');

        const selectedRoomType = document.querySelector('input[name="roomType"]:checked').value;

        if (selectedRoomType === 'Sicherheitstreppenraum') {
            if (v >= 2.0) {
                airflowVelocityDisplay.classList.add('bg-ok');
                airflowVelocityResult.classList.add('text-ok');
                airflowVelocityStatus.classList.add('text-ok');
                airflowVelocityStatus.textContent = 'Status: OK (≥ 2,0 m/s für Sicherheitstreppenraum)';
            } else if (v >= 1.0 && v < 2.0) {
                airflowVelocityDisplay.classList.add('bg-warning');
                airflowVelocityResult.classList.add('text-warning');
                airflowVelocityStatus.classList.add('text-warning');
                airflowVelocityStatus.textContent = 'Status: Achtung (≥ 1,0 m/s, aber < 2,0 m/s)! Ggf. unter bestimmten Bedingungen zulässig.';
            } else {
                airflowVelocityDisplay.classList.add('bg-danger');
                airflowVelocityResult.classList.add('text-danger');
                airflowVelocityStatus.classList.add('text-danger');
                airflowVelocityStatus.textContent = 'Status: NICHT OK (< 1,0 m/s)! Strömungsgeschwindigkeit zu gering.';
            }
        } else if (selectedRoomType === 'Feuerwehraufzug') {
            if (v >= 0.75) {
                airflowVelocityDisplay.classList.add('bg-ok');
                airflowVelocityResult.classList.add('text-ok');
                airflowVelocityStatus.classList.add('text-ok');
                airflowVelocityStatus.textContent = 'Status: OK (≥ 0,75 m/s für Feuerwehraufzugsvorraum)';
            } else {
                airflowVelocityDisplay.classList.add('bg-danger');
                airflowVelocityResult.classList.add('text-danger');
                airflowVelocityStatus.classList.add('text-danger');
                airflowVelocityStatus.textContent = 'Status: NICHT OK (< 0,75 m/s)! Strömungsgeschwindigkeit zu gering.';
            }
        }
    };

    // Funktion zur Synchronisierung von Slider und Zahlenfeld
    const syncInputs = (slider, numberInput) => {
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
            updateCalculations();
        });
        numberInput.addEventListener('input', () => {
            // Sicherstellen, dass der Wert im gültigen Bereich liegt, bevor er dem Slider zugewiesen wird
            let value = parseFloat(numberInput.value);
            const min = parseFloat(numberInput.min);
            const max = parseFloat(numberInput.max);
            if (isNaN(value) || value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            numberInput.value = value.toFixed(2); // Fix for number input sometimes not updating decimal places
            slider.value = value;
            updateCalculations();
        });
    };

    // Spezielle Synchronisierung für Türbreite, um b2-Range anzupassen
    doorWidthSlider.addEventListener('input', () => {
        doorWidthInput.value = doorWidthSlider.value;
        updateB2Range(); // Update b2 range when doorWidth changes
        updateCalculations();
    });
    doorWidthInput.addEventListener('input', () => {
        let value = parseFloat(doorWidthInput.value);
        const min = parseFloat(doorWidthInput.min);
        const max = parseFloat(doorWidthInput.max);
        if (isNaN(value) || value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        doorWidthInput.value = value.toFixed(2);
        doorWidthSlider.value = value;
        updateB2Range(); // Update b2 range when doorWidth changes
        updateCalculations();
    });

    // Funktion zur dynamischen Anpassung des b2-Sliders und Inputs Max-Wertes
    const updateB2Range = () => {
        const currentDoorWidth = parseFloat(doorWidthInput.value);
        // Max b2 should be slightly less than doorWidth to be physically possible
        const newMaxB2 = Math.max(0.01, currentDoorWidth - 0.01); // Ensure it's not negative or zero

        b2DistanceSlider.max = newMaxB2;
        b2DistanceInput.max = newMaxB2;

        // If current b2 value exceeds new max, adjust it
        let currentB2 = parseFloat(b2DistanceInput.value);
        if (currentB2 > newMaxB2) {
            b2DistanceInput.value = newMaxB2.toFixed(2);
            b2DistanceSlider.value = newMaxB2.toFixed(2);
        }
    };


    // Synchronisierung für andere Eingabepaare
    syncInputs(doorHeightSlider, doorHeightInput);
    syncInputs(differentialPressureSlider, differentialPressureInput);
    syncInputs(doorCloserMomentSlider, doorCloserMomentInput);
    syncInputs(b2DistanceSlider, b2DistanceInput); // b2 Slider synchronisieren (normale sync für Input/Slider)
    syncInputs(volumeFlowSlider, volumeFlowInput);

    // Event-Listener für Radio-Buttons (Raumtyp)
    roomTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateCalculations);
    });

    // Reset-Funktion
    resetButton.addEventListener('click', () => {
        doorWidthInput.value = defaultValues.doorWidth;
        doorWidthSlider.value = defaultValues.doorWidth;
        doorHeightInput.value = defaultValues.doorHeight;
        doorHeightSlider.value = defaultValues.doorHeight;
        differentialPressureInput.value = defaultValues.differentialPressure;
        differentialPressureSlider.value = defaultValues.differentialPressure;
        doorCloserMomentInput.value = defaultValues.doorCloserMoment;
        doorCloserMomentSlider.value = defaultValues.doorCloserMoment;
        
        // Reset b2 and ensure its range is updated based on default doorWidth
        b2DistanceInput.value = defaultValues.b2Distance; 
        b2DistanceSlider.value = defaultValues.b2Distance;
        updateB2Range(); // Call updateB2Range after resetting doorWidth and b2

        volumeFlowInput.value = defaultValues.volumeFlow;
        volumeFlowSlider.value = defaultValues.volumeFlow;

        // Reset room type radio button
        document.getElementById('roomTypeSafetyStairwell').checked = true;

        updateCalculations(); // Berechnungen nach Reset aktualisieren
    });

    // Initialberechnung beim Laden der Seite
    updateB2Range(); // Set initial b2 max based on default door width
    updateCalculations();
});
