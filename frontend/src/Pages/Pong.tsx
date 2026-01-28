import { useState, useEffect } from 'react'
import './style/Pong.css'

export default function Pong()
{
  const [showPong, setShowPong] = useState(false);
  // Bloque le scroll du body uniquement quand le jeu est affiché
  useEffect(() => {
    if (showPong) {
      document.body.style.overflow = 'hidden';
      // Force focus sur l'iframe quand elle apparaît
      setTimeout(() => {
        const iframe = document.querySelector('iframe[title="Pong Game"]');
        if (iframe && 'focus' in iframe) {
          (iframe as HTMLIFrameElement).focus();
        }
      }, 500);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPong]);
  return(
    <div className="w-full flex flex-col items-center min-h-screen flex items-center justify-center gap-5">

        <button className="btn-play"
        onClick={() => setShowPong(true)}>
        Jouer</button>

        <button className="btn-play">
        Parametres</button>

        {showPong && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <div className="flex flex-col items-center justify-center" style={{ height: '110vh', justifyContent: 'center' }}>
              <iframe
                src="/Pong/index.html"
                title="Pong Game"
                className="rounded shadow-lg"
                style={{ width: '80vw', height: '80vh', background: 'white', border: 'none' }}
                allowFullScreen
              ></iframe>
              <div style={{ height: '2.5rem' }}></div>
              <button
                className="btn-play"
                onClick={() => setShowPong(false)}
              >
                Retour
              </button>
            </div>
          </div>
        )}
    </div>
  )
}