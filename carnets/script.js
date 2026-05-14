const form = document.getElementById('carnetForm');
const previewBtn = document.getElementById('previewBtn');
const canvas = document.getElementById('carnetCanvas');
const ctx = canvas.getContext('2d');

// FUNCIÓN DE DIBUJO (IDÉNTICA A LA TUYA, NO TOCAMOS COORDENADAS)
async function generarCarnet() {
    return new Promise((resolve, reject) => {
        const plantilla = new Image();
        plantilla.src = 'plantilla.jpg';

        plantilla.onload = function() {
            canvas.width = 1600;
            canvas.height = 1135;
            ctx.drawImage(plantilla, 0, 0, 1600, 1135);

            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 45px Arial';
            
            ctx.fillText(document.getElementById('nombre').value.toUpperCase(), 599, 427);
            ctx.fillText(document.getElementById('apellido').value.toUpperCase(), 599, 561);

            ctx.font = '35px Arial';
            ctx.fillText(document.getElementById('direccion').value, 609, 808);
            ctx.fillText(document.getElementById('email').value, 730, 887);

            const hoy = new Date();
            const dia = String(hoy.getDate()).padStart(2, '0');
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            const anio = hoy.getFullYear();
            const fechaFormateada = `${dia}/${mes}/${anio}`;

            ctx.font = 'bold 22px Arial';
            ctx.fillText(fechaFormateada, 1073, 1085); 

            const fotoFile = document.getElementById('fotoInput').files[0];
            if (!fotoFile) {
                alert("Selecciona una foto.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const fotoImg = new Image();
                fotoImg.onload = function() {
                    const mX = 48, mY = 335, mAncho = 477, mAlto = 650;
                    let fX, fY, fAncho, fAlto;
                    const propMarco = mAncho / mAlto;
                    const propFoto = fotoImg.width / fotoImg.height;

                    if (propFoto > propMarco) {
                        fAlto = fotoImg.height;
                        fAncho = fotoImg.height * propMarco;
                        fX = (fotoImg.width - fAncho) / 2; fY = 0;
                    } else {
                        fAncho = fotoImg.width;
                        fAlto = fotoImg.width / propMarco;
                        fX = 0; fY = (fotoImg.height - fAlto) / 2;
                    }

                    ctx.drawImage(fotoImg, fX, fY, fAncho, fAlto, mX, mY, mAncho, mAlto);
                    canvas.style.display = "inline-block";
                    resolve();
                };
                fotoImg.src = event.target.result;
            };
            reader.readAsDataURL(fotoFile);
        };
        plantilla.onerror = () => reject("No se pudo cargar la plantilla.jpg");
    });
}

// VISTA PREVIA
previewBtn.addEventListener('click', async () => {
    if (form.checkValidity()) {
        await generarCarnet();
        canvas.scrollIntoView({ behavior: 'smooth' });
    } else {
        form.reportValidity();
    }
});

// Formulario Submit: Genera y descarga el PDF
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    await generarCarnet();
    
    const { jsPDF } = window.jspdf;
    const pdf = new jspdf.jsPDF('p', 'mm', 'a4');

    // --- TAMAÑO XL (12cm de ancho) ---
    const anchoMM = 120; 
    const altoMM = 85;   // Mantiene la proporción 1600x1135 casi exacta
    const x = (210 - anchoMM) / 2; // Centrado horizontal
    const y = 20; // Un poco más arriba para que quepan las dos caras

    // 1. Añadir Cara Frontal
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(imgData, 'JPEG', x, y, anchoMM, altoMM);

    // 2. Añadir Cara Trasera
    try {
        pdf.addImage('trasera.jpg', 'JPEG', x, y + altoMM, anchoMM, altoMM);
    } catch (error) {
        console.error("Falta el archivo trasera.jpg");
        pdf.setDrawColor(200);
        pdf.rect(x, y + altoMM, anchoMM, altoMM);
    }

    // 3. Línea de puntos para el doblez
    pdf.setLineDash([1, 1], 0);
    pdf.line(x, y + altoMM, x + anchoMM, y + altoMM);

    pdf.save(`Carnet_${document.getElementById('nombre').value}.pdf`);
});