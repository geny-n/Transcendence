// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './Components/Navbar/Navbar'
import HomeP from './Pages/HomePage'
import Pong from './Pages/Pong'
import ScoreB from './Pages/ScoreBoard'
import Teams from './Pages/Teams'
import Chat from './Pages/Chat'
import Login from './Pages/Login'
import Register from './Pages/Register'
import {Routes, Route} from "react-router-dom"

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeP />} />
        <Route path="/pong" element={<Pong />} />
        <Route path="/scoreBoard" element={<ScoreB />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
