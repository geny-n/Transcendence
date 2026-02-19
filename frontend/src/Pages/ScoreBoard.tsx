import { useState } from "react";
import './style/ScoreBoard.css'


export default function ScoreBoard()
{
  const game = [
    {id_game:'1', username1:'toto', username2:'titi', score1: 10, score2: 20},
    {id_game:'2', username1:'papa', username2:'mama', score1: 30, score2: 40},
    {id_game:'3', username1:'popo', username2:'pupu', score1: 20, score2: 40},
  ]
  const [showModalScore, setshowModalScore] = useState(false)
  const [ScoreData, setScoreData] = useState<typeof game[0] | null>(null);

  return(
    
      <div className="all_score_screen">
        <div className="top_screen ">
          <div className="flex justify-center gap-0.5 pb-6">
            <div className="inidicator">player 1</div>
            <div className="inidicator">score</div>
            <div className="inidicator">player 2</div>
          </div>

          {game.map((theGame) =>
          
            <div className="flex bg-green-200 justify-center gap-0.5 py-0.5" key={theGame.id_game} onClick={() => { setScoreData(theGame); setshowModalScore(true) }}>

              <div className="game">{theGame.username1}</div>
              <div className="game">{theGame.score1} / {theGame.score2}</div>
              <div className="game">{theGame.username2}</div>
            </div>
            
          )}
        </div>
        {showModalScore && ScoreData && 
          <div className="fixed inset-0 bg-slate-500/75 flex items-center justify-center">
            
            <div className="flex flex-col gap-4 p-10 bg-gray-300 rounded py-10">
              <div className="text-black text-2xl">Score</div>
              <div className="text-black">{ScoreData.username1} vs {ScoreData.username2}</div>
              
              <button className="bg-red-600 px-2 py-2 rounded" onClick={() => setshowModalScore(false)}>close</button>
            </div>          
          </div>
        }
      </div>
  )
}