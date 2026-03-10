import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Chat.css'
// import defaultpp from '/pp/default.jpg'
import axios from "axios";
import { TheSocket } from "../socket"

export default function Chat ()
{
  const navigate = useNavigate();
  const [lstFriends, setLstFriends] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean}[]>([]);
  const [Myself, setMyself] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean} | null>(null);

  // To send authorization credentials using the Fetch API in JavaScript, 
  // you need to allow the credentials to be sent to the server by adding the «credential: 'include'» parameter when calling the fetch() method. 
  // Default Fetch API requests do not contain user credentials such as cookies and HTTP authentication headers. 
  // This is done for security reasons because user authentication data allows JavaScript to act on behalf of the user and obtain private information. 
  // If you want to send credentials only to the original domain, use the «credentials: 'same-origin'» parameter. 
  // To prevent the browser from sending credentials at all, use the «credentials: 'omit'» option. 
  // In this JavaScript Fetch API with Credentials example, we send a request with «credential: 'include'» 
  // parameter to the ReqBin echo URL using the fetch() method. 
  // Click Execute to run the JavaScript Fetch API with Credentials example online and see the result.
 
 
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await axios.get('/api/users/me', {
          withCredentials:true
        });
        if (!response.data.success) {
          throw Error(`Error API Me: ${response.status} ${response.statusText}`);
        }
        setMyself(response.data.user);
      }
      catch(error) {
        console.error('User not authenticated, redirecting to login...', error);
        navigate('/login');
      }
    }
    fetchMe()
  }, [navigate]);

  useEffect(() => {
    if (!Myself) return;

    const fetchFriends = async () => {
      // setLoading(true);
      try {
        const result = await axios.get('/api/friends', {
          withCredentials: true,
        });
        
        if (!result.data.success || !Array.isArray(result.data.friends)) {
          throw Error(`Error API Friends: ${result.status} ${result.statusText}`);
        }
        const friends = result.data.friends.map((f: any) => {
          if (f.user1.id === Myself.id)
            return f.user2;
          else
            return f.user1;
        });
        setLstFriends(friends);
      }
      catch(error) {
        console.error('Error fetch : ', error);
      }
      // finally {
      //   setLoading(false);
      // }

    }
      fetchFriends();
  }, [Myself]);

  const[selectFriend, setSelectFriend] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean} | null>(null);

  
  const status = (isOnline: boolean) => {
    if (isOnline)
        return "bg-emerald-500";
    return "bg-gray-300";
  }

  const socket = TheSocket();
  
  const [NewMsg, setNewMsg] = useState('');
  const [prevMsg, setPrevMsg] = useState<{msg: string, time: string, sender: string, avatarUrl:string}[]>([]);
  //permet de garder en memoire touts les messages (le 1er message n es pas ecraser par le 2eme)

  // useEffect (() => {
  //   if (!socket)
  //     return;
  //   socket.on('privMessage', (incoming: { user: string; text: string; time: string; senderId: string }) => {
  //     console.log('socket recu:', incoming, 'selectFriend:', selectFriend?.username);
  //     if (incoming.senderId !== selectFriend?.id) return;
  //     setPrevMsg(prevMsg => [
  //       ...prevMsg,
  //       {
  //         msg: incoming.text,
  //         time: incoming.time,
  //         sender: incoming.user
  //       }
  //     ])
  //   });
  //   return () => { socket.off(`privMessage`);};
  // }, [socket]);

  useEffect(() => {
    if (!socket || !selectFriend)
        return;
    const handler = (incoming: {
      user:string;
      text: string;
      time: string;
      senderId: string;
    }) => {
      console.log('socket recu:', incoming, 'selectFriend:', selectFriend.username);
      if (incoming.senderId !== selectFriend.id)
          return;
      setPrevMsg(prev => [...prev, {
        msg: incoming.text,
        time: incoming.time,
        sender: incoming.user,
        avatarUrl: selectFriend.avatarUrl
      }
      ]);
    }
    socket.on("privMessage", handler);
    return () => {
      socket.off("privMessage", handler);
    };
  },[socket, selectFriend]);

  //pour selectionner uniquement les messages concernant l ami selectionne
  useEffect(() => {
    setPrevMsg([]);
    if (!Myself || !selectFriend)
      return;
    axios.get(`/api/users/chat/${selectFriend.id}`, {withCredentials:true})
      .then(res => {
        console.log('messages recu:', res.data);
        const loaded = res.data.messages.map((m:any) =>({
          msg:m.message,
          time: new Date(m.time).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),

          // Si senderId = mon id → c'est moi qui ai envoyé → affiche mon username
          // Sinon → c'est mon ami qui a envoyé → affiche son username
          sender: m.senderId === Myself.id ? Myself.username : selectFriend.username,
          avatarUrl: m.senderId === Myself.id ? Myself.avatarUrl : selectFriend.avatarUrl, 
        }));
        setPrevMsg(loaded);
      })
  }, [selectFriend]);

  const sendMsg = () => {
    if (!NewMsg.trim() || !Myself || !selectFriend || !socket) //verifier les messages vides ou espace avant et fin du message
      return; 
    const theTime = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
    socket.emit("privMessage", {
      user: Myself.username,
      text: NewMsg,
      time: theTime,
      receivedId: selectFriend.id,
    });

    setPrevMsg([...prevMsg, {msg:NewMsg, time:theTime, sender: Myself.username, avatarUrl:Myself.avatarUrl}]);
    setNewMsg('');
  }

    return (
      <div className="all_chat_screen">        
        <div className="top">
          {/* ***************************************************************** */}
          <div className="myPP">
            {Myself && (
              <>
              <img className="rounded-full w-9 h-9" src={Myself.avatarUrl}></img>
              <p>{Myself.username}</p>
              </>
            )}
          </div>
            
          {/* ***************************************************************** */}

          <div className="box_friend">
            {selectFriend && (
            <>
              <div className="relative">
                <div className="w-13 pl-1">
                  <img className="rounded-full w-9 h-9" src={selectFriend.avatarUrl}></img>
                  <span className={`friend_status ${status(selectFriend.isOnline)}`}></span>
                </div>
              </div>
              <div className="truncate">{selectFriend.username}</div>
            </>)}
          </div>
        </div>

          {/* ***************************************************************** */}

        <div className="bottom">
          <div className="box_list">
            {lstFriends.map((theFriend, idx) =>
            {
              let isSelected;
              if (selectFriend?.id === theFriend.id)
                  isSelected = 'bg-gray-300';
              return (
                <div className={`display_lst ${isSelected}`} 
                  key={idx} onClick={()=>setSelectFriend(theFriend)}
                >
                  <img className="rounded-full w-10 h-10" src={theFriend.avatarUrl}></img>
                  <span className={`display_status ${status(theFriend.isOnline)}`}></span>
                  <div className="truncate">{theFriend.username}</div>
                </div>
              );
            })}
          </div>
          
          {/* ***************************************************************** */}
          
          <div className="w-2/3 flex flex-col ">
              <div className="box_message">
              {/* permet de mapper chaque message envoyer en leur donnant un index pour les affichiers dans l ordre d envoie */}
              {prevMsg.map((theMsg, idx) =>
              <div className="display_Msg" key={idx}>
                <div className="flex gap-3">
                  <img className="rounded-full w-12 h-12" src={theMsg.avatarUrl}></img>
                  <span className="text-sm font-semibold">{theMsg.sender}</span>
                  <span className="text-sm text-body">{theMsg.time}</span>
                </div>
                <span className="flex items-left pt-1 text-left whitespace-normal">{theMsg.msg}</span>
              </div>)}
            </div>
          
          {/* ***************************************************************** */}  
          
          <div className="box_send">
              <textarea
                value={NewMsg}
                onChange={e => setNewMsg(e.target.value)}
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
