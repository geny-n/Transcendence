// import { useState } from 'react';
import './style/Chat.css'
export default function Chat ()
{
    return (
      <div className="all_screan"> {/* toute la zone*/}
        <div className="chat_screen">
          
          <div className="flex flex-col w-1/3"> {/* partie gauche */}
            
            <div className="bg-amber-700 h-10">{/* recherche (box1)*/}
              <form action="/search" className="max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="recherche"
                  className="search"/>
                
              </form>
            </div>

            <div className="box_2">liste friends</div>
          
          </div>
        {/* 88888888888888888888888888888888888888888888888888 */}
          <div className="flex flex-col w-2/3"> {/* partie droite */}
            <div className="box_1">friend</div>
            <div className="box_2">message</div>
            <div className="bg-red-300 h-15">
              <button type="button" class="text-white bg-warning box-border border border-transparent hover:bg-warning-strong focus:ring-4 focus:ring-warning-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Warning</button>
            </div>
          </div>
        </div>
      </div>
    )

}