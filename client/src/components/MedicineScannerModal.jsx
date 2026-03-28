import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Upload, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

const MedicineScannerModal = ({ isOpen, onClose, onScanComplete }) => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedText, setScannedText] = useState('');
    const [detectedMedicines, setDetectedMedicines] = useState([]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setScannedText('');
            setDetectedMedicines([]);
        }
    };

    const processImage = async () => {
        if (!image) return;

        setIsProcessing(true);
        try {
            const result = await Tesseract.recognize(
                image,
                'eng',
                { logger: m => console.log(m) }
            );

            const text = result.data.text;
            setScannedText(text);
            parseText(text);
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Failed to scan image. Please try again or type manually.");
        } finally {
            setIsProcessing(false);
        }
    };

    const parseText = (text) => {
        const lines = text.split('\n');
        const medicines = [];

        // Helper regex
        const dosageRegex = /(\d+\s*(?:mg|ml|g|mcg|units|tablet|capsule))/i;
        const frequencyRegex = /(daily|once|twice|2\s*times|3\s*times|thrice|bid|tid|morning|night|bedtime)/i;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length < 4 || /prescription|pharmacy|rx|date|dr\./i.test(trimmed)) continue;

            const dosageMatch = trimmed.match(dosageRegex);
            const freqMatch = trimmed.match(frequencyRegex);

            if (dosageMatch) {
                // Heuristic: If we find dosage, this line likely describes a medicine
                // We'll treat the text BEFORE the dosage as the Name (simplified)
                const namePart = trimmed.split(dosageMatch[0])[0].trim();
                const cleanName = namePart.replace(/[^a-zA-Z0-9\s]/g, '').trim(); // Remove weird symbols

                // determine times based on frequency
                const freq = freqMatch ? freqMatch[0].toLowerCase() : 'daily';
                const dosage = dosageMatch[0];

                const createEntry = (timeSuffix) => ({
                    id: Date.now() + Math.random(),
                    name: cleanName || "Unknown Med",
                    dosage: dosage,
                    time: timeSuffix,
                    original: trimmed
                });

                if (freq.includes('twice') || freq.includes('2 times') || freq.includes('bid')) {
                    medicines.push(createEntry("09:00 AM"));
                    medicines.push(createEntry("09:00 PM"));
                } else if (freq.includes('3 times') || freq.includes('thrice') || freq.includes('tid')) {
                    medicines.push(createEntry("09:00 AM"));
                    medicines.push(createEntry("02:00 PM"));
                    medicines.push(createEntry("09:00 PM"));
                } else if (freq.includes('night') || freq.includes('bedtime')) {
                    medicines.push(createEntry("09:00 PM"));
                } else {
                    // Default to morning
                    medicines.push(createEntry("09:00 AM"));
                }
            }
        }

        if (medicines.length === 0) {
            // Fallback: try to add at least one item if text exists
            medicines.push({
                id: Date.now(),
                name: "Scanned Medicine",
                dosage: "",
                time: "09:00 AM"
            });
        }

        setDetectedMedicines(medicines);
    };

    const updateMedicine = (id, field, value) => {
        setDetectedMedicines(prev => prev.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    const removeMedicine = (id) => {
        setDetectedMedicines(prev => prev.filter(m => m.id !== id));
    };

    const handleAddManual = () => {
        setDetectedMedicines(prev => [...prev, {
            id: Date.now(),
            name: "",
            dosage: "",
            time: "09:00 AM"
        }]);
    };

    const handleConfirm = () => {
        // filter out empties
        const valid = detectedMedicines.filter(m => m.name.trim() !== "");
        onScanComplete(valid);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full relative animate-fadeIn max-h-[90vh] overflow-y-auto mx-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-blue-500" />
                    Scan Prescription
                </h2>

                <div className="space-y-6">
                    {/* Image Upload Area */}
                    {!scannedText && (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative bg-gray-50">
                            {preview ? (
                                <img src={preview} alt="Upload Preview" className="max-h-64 object-contain rounded-lg shadow-sm" />
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="text-sm text-gray-500 font-medium">Click to upload or take a photo</p>
                                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    {preview && !isProcessing && !scannedText && (
                        <button
                            onClick={processImage}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            Run OCR Scan
                        </button>
                    )}

                    {isProcessing && (
                        <div className="flex flex-col items-center justify-center py-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                            <p className="text-sm text-gray-500">Processing image...</p>
                        </div>
                    )}

                    {/* Editor List */}
                    {scannedText && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-700">Detected Medicines</h3>
                                <button onClick={handleAddManual} className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline">
                                    <Plus className="w-4 h-4" /> Add Row
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 max-h-60 overflow-y-auto">
                                {detectedMedicines.map((med, idx) => (
                                    <div key={med.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                className="w-full p-2 text-sm border rounded"
                                                value={med.name}
                                                onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Dose"
                                                className="w-full p-2 text-sm border rounded"
                                                value={med.dosage}
                                                onChange={(e) => updateMedicine(med.id, 'dosage', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            {/* Note: Server expects "08:00 AM". If user scans multiple, we default to 9AM/9PM */}
                                            {/* Let's just use text input or simple time select. For simplicity: text */}
                                            <input
                                                type="text"
                                                placeholder="Time"
                                                className="w-full p-2 text-sm border rounded"
                                                value={med.time}
                                                onChange={(e) => updateMedicine(med.id, 'time', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button
                                                onClick={() => removeMedicine(med.id)}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {detectedMedicines.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">No medicines detected. Add manually?</div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setScannedText(''); setPreview(null); setImage(null); }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Rescan
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Add {detectedMedicines.length} Medicines
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MedicineScannerModal;
