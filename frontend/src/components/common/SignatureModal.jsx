import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, Eraser } from 'lucide-react';

const SignatureModal = ({ isOpen, onClose, onSave, title, description }) => {
    const sigCanvas = useRef({});
    const [isEmpty, setIsEmpty] = useState(true);

    if (!isOpen) return null;

    const clear = () => {
        sigCanvas.current.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (isEmpty) {
            alert('Por favor agrega una firma para continuar.');
            return;
        }
        const signatureData = sigCanvas.current.toDataURL('image/png');
        onSave(signatureData);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: '#1a1a1a', padding: '2rem', borderRadius: '10px',
                width: '100%', maxWidth: '600px', border: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, color: '#fff' }}>{title || 'Firma Requerida'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
                    {description || 'Por favor firma en el recuadro a continuación para confirmar.'}
                </p>

                <div style={{ border: '2px dashed #444', borderRadius: '8px', background: '#fff', marginBottom: '1.5rem' }}>
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{ height: 200, className: 'sigCanvas', style: { width: '100%', height: '200px' } }}
                        onBegin={() => setIsEmpty(false)}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button
                        onClick={clear}
                        className="btn btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b' }}
                    >
                        <Eraser size={18} /> Limpiar
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Check size={18} /> Confirmar Firma
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
