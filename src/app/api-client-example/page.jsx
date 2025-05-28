
'use client';

import React, { useState, useRef } from 'react';

export default function ApiClientExamplePage() {
  const [problemText, setProblemText] = useState('');
  const [problemImageFile, setProblemImageFile] = useState(null); // Va stoca { file, previewUrl }
  const [solutionImageFiles, setSolutionImageFiles] = useState([]); // Va stoca un array de { file, previewUrl }
  
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const problemInputRef = useRef(null);
  const solutionInputRef = useRef(null);

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProblemFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const previewUrl = await fileToDataUrl(file);
        setProblemImageFile({ file, previewUrl });
        setError(null);
      } catch (err) {
        console.error("Error reading problem file:", err);
        const errorMsg = "A apărut o eroare la citirea imaginii problemei.";
        setError(errorMsg);
        alert(errorMsg);
      }
      if (problemInputRef.current) problemInputRef.current.value = '';
    }
  };

  const handleSolutionFilesChange = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImageFiles = [];
      try {
        for (const file of files) {
          const previewUrl = await fileToDataUrl(file);
          newImageFiles.push({ file, previewUrl });
        }
        setSolutionImageFiles(prev => [...prev, ...newImageFiles]);
        setError(null);
      } catch (err) {
        console.error("Error reading solution files:", err);
        const errorMsg = "A apărut o eroare la citirea imaginilor soluției.";
        setError(errorMsg);
        alert(errorMsg);
      }
      if (solutionInputRef.current) solutionInputRef.current.value = '';
    }
  };

  const removeProblemImage = () => setProblemImageFile(null);
  const removeSolutionImage = (index) => {
    setSolutionImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!problemText.trim() && !problemImageFile) {
      const errorMsg = 'Te rog introdu textul problemei SAU încarcă o imagine a problemei.';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }
    if (solutionImageFiles.length === 0) {
      const errorMsg = 'Te rog încarcă cel puțin o imagine cu rezolvarea.';
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const payload = {
        problemText: problemText.trim() || undefined,
        problemPhotoDataUri: problemImageFile?.previewUrl,
        solutionPhotoDataUris: solutionImageFiles.map(img => img.previewUrl),
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }
      
      setApiResponse(result);
      alert("Analiza a fost primită.");

    } catch (err) {
      console.error('Error calling API:', err);
      const message = err instanceof Error ? err.message : 'A apărut o eroare necunoscută la apelarea API-ului.';
      setError(message);
      alert(`Eroare API: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileInput = (ref) => ref.current?.click();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: 'auto', backgroundColor: '#f0f2f5' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', color: '#333' }}>Exemplu Client API Fizică (JSX Pur)</h1>
          <p style={{ color: '#555' }}>Această pagină demonstrează apelarea endpoint-ului `/api/analyze` din client-side React folosind doar JS și HTML standard.</p>
        </header>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
          {/* Problem Input */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h2 style={{ marginTop: '0', color: '#333' }}>Problemă</h2>
            <div>
              <label htmlFor="problem-text-api" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Text Problemă:</label>
              <textarea
                id="problem-text-api"
                placeholder="Scrie enunțul problemei..."
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                style={{ width: 'calc(100% - 20px)', minHeight: '100px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={!!problemImageFile}
              />
            </div>
            <div style={{ textAlign: 'center', margin: '10px 0', color: '#777' }}>SAU</div>
            <div>
              <label htmlFor="problem-image-api" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Imagine Problemă:</label>
              <input id="problem-image-api" type="file" accept="image/*" ref={problemInputRef} onChange={handleProblemFileChange} style={{ display: 'none' }} disabled={!!problemText.trim()} />
              <button type="button" onClick={() => triggerFileInput(problemInputRef)} style={{ width: '100%', padding: '10px', marginTop: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={!!problemText.trim()}>
                Încarcă Imagine Problemă
              </button>
              {problemImageFile && (
                <div style={{ marginTop: '10px', position: 'relative', textAlign: 'center' }}>
                  <img src={problemImageFile.previewUrl} alt="Previzualizare problemă" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #eee', borderRadius: '4px', objectFit: 'contain' }} />
                  <button type="button" onClick={removeProblemImage} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: '24px' }}>X</button>
                </div>
              )}
            </div>
          </div>

          {/* Solution Input */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h2 style={{ marginTop: '0', color: '#333' }}>Soluție</h2>
            <label htmlFor="solution-images-api" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Imagini Soluție ({solutionImageFiles.length})*:</label>
            <input id="solution-images-api" type="file" accept="image/*" multiple ref={solutionInputRef} onChange={handleSolutionFilesChange} style={{ display: 'none' }} />
            <button type="button" onClick={() => triggerFileInput(solutionInputRef)} style={{ width: '100%', padding: '10px', marginTop: '5px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Adaugă Imagini Soluție
            </button>
            {solutionImageFiles.length > 0 ? (
              <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {solutionImageFiles.map((img, index) => (
                  <div key={index} style={{ position: 'relative', border: '1px solid #eee', borderRadius: '4px', padding: '5px' }}>
                    <img src={img.previewUrl} alt={`Soluție ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'contain' }} />
                    <button type="button" onClick={() => removeSolutionImage(index)} style={{ position: 'absolute', top: '0px', right: '0px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', borderRadius: '0 4px 0 4px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', lineHeight: '20px' }}>X</button>
                  </div>
                ))}
              </div>
            ) : (
               <div style={{ marginTop: '10px', height: '100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: '4px', color: '#777', backgroundColor: '#f9f9f9' }}>
                 Nicio imagine cu soluția.
               </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '20px', padding: '10px', border: '1px solid red', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
            <strong>Eroare:</strong> {error}
          </div>
        )}

        <button type="button" onClick={handleSubmit} disabled={isLoading || solutionImageFiles.length === 0 || (!problemText.trim() && !problemImageFile)} style={{ width: '100%', padding: '15px', fontSize: '16px', backgroundColor: (isLoading || solutionImageFiles.length === 0 || (!problemText.trim() && !problemImageFile)) ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
          {isLoading ? 'Se trimite la API...' : 'Trimite la API'}
        </button>

        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: '10px', color: '#555' }}>
            <p>Se apelează API-ul...</p>
            {/* Aici ai putea adauga un spinner simplu CSS dacă dorești, dar pentru "doar JS" ramane text */}
          </div>
        )}

        {apiResponse && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <h3 style={{ color: '#333' }}>Răspuns API</h3>
            <div style={{ border: '1px solid #ffc107', padding: '15px', borderRadius: '5px', marginBottom: '15px', backgroundColor: '#fff3cd' }}>
              <h4 style={{ marginTop: '0', color: '#856404' }}>Punctaj</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#fff9e6', padding: '10px', borderRadius: '4px' }}>{apiResponse.rating}</pre>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '15px', backgroundColor: '#f8f9fa' }}>
              <h4 style={{ marginTop: '0', color: '#333' }}>Soluție Corectă</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px' }}>{apiResponse.solution}</pre>
            </div>
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
              <h4 style={{ marginTop: '0', color: '#333' }}>Analiză Erori & Feedback</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px' }}>{apiResponse.errorAnalysis}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    