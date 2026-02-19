import { useState  } from 'react';
import './style/Chat.css'
import defaultpp from '/pp/default.jpg'

export default function Chat ()
{
  const [aMsg, setMsg] = useState('');
  const [messages, setmessages] = useState<{msg: string, time: string}[]>([]);
  //permet de garder en memoire touts les messages (le 1er message n es pas ecraser par le 2eme)
  const sendMsg = () => {
    if (!aMsg.trim()) //verifier les messages vides ou espace avant et fin du message
      return;
    const time = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
    setmessages([...messages, {msg:aMsg, time}]);
    setMsg('');
  }

  const mockFriends = [
    { id: '1', username: 'Alsdfsdfsdfdsfsfsdfdsfsfsdfsdfsice', avatarUrl: defaultpp, isOnline: true },
    { id: '2', username: 'Bea', avatarUrl: defaultpp, isOnline: true },
    { id: '3', username: 'Jean', avatarUrl: defaultpp, isOnline: false },
    { id: '4', username: 'Tom', avatarUrl: defaultpp, isOnline: true },
  ];
  const status = (isOnline: boolean) => {
    if (isOnline)
        return "bg-emerald-500";
    return "bg-gray-300";
  }
  const [selectFriend, setSelectFriend] = useState(mockFriends[0]);

    return (
      <div className="all_chat_screen"> {/* toute la zone*/}
        <div className="chat_screen">
          <div className="flex flex-col w-1/3"> {/* partie gauche */}

          {/* 88888888888888888888888888888888888888888888888888 */}

            <div className="box_search">{/* recherche (box1)*/}
              {/* <form action="/search" className="search"> */}
                <input
                  type="text"
                  placeholder="recherche"
                  className="search"/>
                
              {/* </form> */}
            </div>

          {/* 88888888888888888888888888888888888888888888888888 */}
            
            <div className="box_list">
              {mockFriends.map((theFriend, idx) =>
                <div className="display_lst" key={idx} onClick={()=>setSelectFriend(theFriend)}>
                  <div className="flex gap-3">
                    <div className="relative">
                      <img className="rounded-full w-10 h-10" src={theFriend.avatarUrl}></img>
                      <span className={`display_status ${status(theFriend.isOnline)}`}></span>
                    </div>
                    <span>{theFriend.username}</span>
                  </div>
                </div>
              )}

            </div>
          
          </div>

          {/* 88888888888888888888888888888888888888888888888888 */}
          
          <div className="flex flex-col w-2/3"> {/* partie droite */}
            <div className="box_friend">
             <div className="relative">
              <img className="rounded-full w-7 h-7 " src={selectFriend.avatarUrl}></img>
              <span className={`display_status ${status(selectFriend.isOnline)}`}></span>

             </div>
              {selectFriend.username}
            </div>
          
          {/* 88888888888888888888888888888888888888888888888888 */}

            <div className="box_message">
              {/* permet de mapper chaque message envoyer en leur donnant un index pour les affichiers dans l ordre d envoie */}
              {messages.map((theMsg, idx) =>
              <div className="display_Msg" key={idx}>
                <div className="flex gap-3">
                  <img className="rounded-full w-12 h-12" src={defaultpp}></img>
                  <span className="text-sm font-semibold">Bonnie Green</span>
                  <span className="text-sm text-body">{theMsg.time}</span>
                </div>
                <span className="flex items-left pt-1 text-left whitespace-normal">{theMsg.msg}</span>
              </div>)}
            </div>
           

            {/* 88888888888888888888888888888888888888888888888888 */}    
            
            <div className="box_send">
              <textarea
                value={aMsg}
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