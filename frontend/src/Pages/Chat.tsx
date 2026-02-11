import { useState,  } from 'react';
import './style/Chat.css'

export default function Chat ()
{
  const [msg, setMsg] = useState('');
  const [messages, setmessages] = useState<string[]>([]);
  //permet de garder en memoire touts les messages (le 1er message n es pas ecraser par le 2eme)
  const sendMsg = () => {
    setmessages([...messages, msg]);
    setMsg('');
  }
  
    return (
      <div className="all_screan"> {/* toute la zone*/}
        <div className="chat_screen">
          <div className="flex flex-col w-1/3"> {/* partie gauche */}
            
            <div className="bg-amber-700 h-13 px-1 py-1 rounded-tl-lg">{/* recherche (box1)*/}
              <form action="/search" className="max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="recherche"
                  className="search"/>
                
              </form>
            </div>

            <div className="box_list">liste friends</div>
          
          </div>
          {/* 88888888888888888888888888888888888888888888888888 */}
          <div className="flex flex-col w-2/3"> {/* partie droite */}
            <div className="box_friend">friend</div>
            <div className="box_message">
              {/* permet de mapper chaque message envoyer en leur donnant un index pour les affichiers dans l ordre d envoie */}
              {messages.map((theMsg, idx) =>
                <div className="display_Msg" key={idx}>
                  {theMsg}
                </div>)}
            </div>

            <div className="box_send">
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder='votre message'
                className="send_msg"
                style={{
                  resize: 'none',
                }}
              />
              <button className="send_but" onClick={sendMsg}>
                Envoyer
              </button>
            </div>

          </div>
        </div>
      </div>
    )

}