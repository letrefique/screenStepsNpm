import React, {useState, useEffect, useRef} from 'react';
import {Button} from 'primereact/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

function ScreenshotRecorder () {
    const [capturing, setCapturing] = useState(false);
    const [disablePDFButton, setDisablePDFButton] = useState(true);
    const screenshotsRef = useRef<{ img: string, description: string, pagePath: string, label: string, content: string, eventType: string }[]>([]);
    const [startPagePath, setStartPagePath] = useState('');

    const handleMouseEvent = async (event: MouseEvent) => {
        if (!capturing) return;

        //region draw red rectangle around event element
        const element = event.target as HTMLElement;
        const overlay = document.createElement('div');
        const rect = element.getBoundingClientRect();

        overlay.style.position = 'absolute';
        overlay.style.border = '2px solid red';
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';

        document.body.appendChild(overlay);
        //endregion

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(document.body);
            const imgData = canvas.toDataURL('image/png');

            const elementInfo = `Tag: ${element.tagName}\nID: ${element.id}\nClasses: ${element.className}\n`;
            const pagePath = window.location.pathname;
            const label = element.getAttribute('aria-label') || element.getAttribute('label') || element.innerText || element.textContent || "No label";
            const content = element.textContent || "No content";
            const eventType = event.type;
            screenshotsRef.current.push({
                img: imgData,
                description: elementInfo,
                pagePath: pagePath,
                label: label,
                content: content,
                eventType: eventType
            });

        } finally {
            document.body.removeChild(overlay);
        }
    };

    const startCapturing = () => {
        screenshotsRef.current = [];
        setStartPagePath(window.location.pathname);
        setCapturing(true);
        setDisablePDFButton(true)
    };

    const stopCapturing = () => {
        setCapturing(false);
        setDisablePDFButton(false)
    };

    const downloadPDF = () => {
        if (screenshotsRef.current.length === 0) return;

        const pdf = new jsPDF();
        screenshotsRef.current.shift();
        screenshotsRef.current.forEach((screenshot, index) => {
            pdf.addImage(screenshot.img, 'PNG', 10, 10, 190, 100);

            let yPos = 120;
            pdf.text(`Page Path: ${screenshot.pagePath}`, 10, yPos);
            yPos += 10;

            pdf.text(`Event Type: ${screenshot.eventType}`, 10, yPos);
            yPos += 10;

            const descriptionLines = pdf.splitTextToSize(`Element Info: ${screenshot.description}`, 180);
            pdf.text(descriptionLines, 10, yPos);
            yPos += descriptionLines.length * 10;

            const labelLines = pdf.splitTextToSize(`Label: ${screenshot.label}`, 180);
            pdf.text(labelLines, 10, yPos);
            yPos += labelLines.length * 10;

            const contentLines = pdf.splitTextToSize(`Content: ${screenshot.content}`, 180);
            pdf.text(contentLines, 10, yPos);
            yPos += contentLines.length * 10;

            if (index < screenshotsRef.current.length - 1) {
                pdf.addPage();
            }
            if (index < screenshotsRef.current.length - 1) {
                pdf.addPage();
            }
        });

        const sanitizedPath = startPagePath.replace(/[/\\?%*:|"<>]/g, '_');
        pdf.save(`${sanitizedPath}.pdf`);
    };

    useEffect(() => {
        document.addEventListener('click', handleMouseEvent);
        document.addEventListener('dblclick', handleMouseEvent);
        document.addEventListener('contextmenu', handleMouseEvent);
        document.addEventListener('dragover', handleMouseEvent);
        return () => {
            document.removeEventListener('click', handleMouseEvent);
            document.removeEventListener('dblclick', handleMouseEvent);
            document.removeEventListener('contextmenu', handleMouseEvent);
            document.removeEventListener('dragover', handleMouseEvent);
        };
    }, [capturing]);

    return (
        <div>
            <div style={{position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000}}>
                <Button
                    label="Start"
                    icon="pi pi-play"
                    onClick={startCapturing}
                    className="p-button-success"
                />
                <Button
                    label="Stop"
                    icon="pi pi-stop"
                    onClick={stopCapturing}
                    className="p-button-danger"
                    style={{marginLeft: '10px'}}
                />
                <Button
                    label="Download PDF"
                    icon="pi pi-file-pdf"
                    onClick={downloadPDF}
                    className="p-button-info"
                    style={{marginLeft: '10px'}}
                    disabled={disablePDFButton}
                />
            </div>
        </div>
    );
};

export default ScreenshotRecorder;
