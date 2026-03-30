// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './Components/Navbar/Navbar'
import HomeP from './Pages/HomePage'
import Pong from './Pages/Pong'
import PongMulti from './Pages/PongMulti'
import ScoreB from './Pages/ScoreBoard'
import Teams from './Pages/Teams'
import Chat from './Pages/Chat'
import Profile from './Pages/Profile'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Matchmaking from './Pages/Matchmaking'
import Admin from './Pages/Admin'
import About from './Pages/About'
import { SocketProvider } from './socket.tsx'
import {Routes, Route, Outlet} from "react-router-dom"


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<SocketProvider><Outlet/></SocketProvider>}>
          <Route path="/" element={<HomeP />} />
          <Route path="/pong" element={<Pong />} />
          <Route path="/pong-multi" element={<PongMulti />} />
          <Route path="/scoreBoard" element={<ScoreB />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path='/admin' element={<Admin />}/>
          <Route path='/about' element={<About />}></Route>
        </Route>
      </Routes>
    </>
  )
}

export default App

// import { useNavigate } from "react-router-dom"

// const navigate = useNavigate()

// <button onClick={() => navigate("/pong")}>
//   Play Pong
// </button>
