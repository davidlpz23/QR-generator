document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const downloadBtn = document.getElementById('download-btn');
    const downloadZipBtn = document.getElementById('download-zip-btn');

    fileInput.addEventListener('change', handleFile, false);
    downloadBtn.addEventListener('click', downloadUpdatedFile, false);
    downloadZipBtn.addEventListener('click', downloadQRZip, false);

    let originalData = [];
    let updatedData = [];
    let qrCodesData = [];

    function handleFile(e) {
        const files = e.target.files;
        if (files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            originalData = XLSX.utils.sheet_to_json(worksheet);

            generateQRCodes(originalData);
        };
        reader.readAsArrayBuffer(file);
    }

    function generateQRCodes(data) {
        const qrCodesContainer = document.getElementById('qr-codes');
        qrCodesContainer.innerHTML = '';
        qrCodesData = [];

        data.forEach((record, index) => {
            const qrCodeDiv = document.createElement('div');
            qrCodeDiv.className = 'qr-code';

            const textDiv = document.createElement('div');
            textDiv.className = 'qr-text';
            textDiv.innerText = JSON.stringify(record, null, 2);  // Display record data

            const qrCode = new QRCode(qrCodeDiv, {
                text: JSON.stringify(record),
                width: 128,
                height: 128
            });

            qrCodeDiv.appendChild(textDiv);
            qrCodesContainer.appendChild(qrCodeDiv);
        });

        setTimeout(() => {
            updatedData = data.map((record, index) => {
                const qrCodeImg = document.querySelectorAll('.qr-code img')[index];
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = qrCodeImg.width;
                canvas.height = qrCodeImg.height;
                context.drawImage(qrCodeImg, 0, 0);

                const qrCodeBase64 = canvas.toDataURL('image/png');
                qrCodesData.push({ name: `qr_code_${index + 1}.png`, data: qrCodeBase64.split(',')[1] });

                return { ...record, qr_code: qrCodeBase64 };
            });

            downloadBtn.style.display = 'inline-block';
            downloadZipBtn.style.display = 'inline-block';
        }, 1000); // Delay to ensure QR codes are rendered
    }

    function downloadUpdatedFile() {
        const worksheet = XLSX.utils.json_to_sheet(updatedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Updated Data');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'updated_file_with_qr_codes.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function downloadQRZip() {
        const zip = new JSZip();
        qrCodesData.forEach(qrCode => {
            zip.file(qrCode.name, qrCode.data, { base64: true });
        });

        zip.generateAsync({ type: 'blob' }).then(function(content) {
            const a = document.createElement('a');
            const url = URL.createObjectURL(content);
            a.href = url;
            a.download = 'qr_codes.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
});
