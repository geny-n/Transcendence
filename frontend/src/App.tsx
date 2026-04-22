import './App.css'
import Navbar from './Components/Navbar/Navbar'
// import HomeP from './Pages/HomePage'
import Pong from './Pages/Pong'
import PongMulti from './Pages/PongMulti'
import ScoreB from './Pages/ScoreBoard'
import Leaderboard from './Pages/Leaderboard'
import Chat from './Pages/Chat'
import Profile from './Pages/Profile'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Matchmaking from './Pages/Matchmaking'
import Admin from './Pages/Admin'
import About from './Pages/About'
import { SocketProvider } from './socket.tsx'
import {Routes, Route, Outlet, Navigate } from "react-router-dom"
import RequireAuth  from "./lib/RequireAuth";

function App() {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				{/* Protected Routes */}
				<Route element={<SocketProvider><Outlet/></SocketProvider>}>

					{/* Public Routes */}
					{/* <Route path="/" element={<HomeP />} /> */}
					<Route path="/" element={<Pong />} />
					<Route path='/about' element={<About />}></Route>
					<Route path="/pong-multi" element={<PongMulti />} />
					<Route path="/scoreBoard" element={<ScoreB />} />
					<Route path="/leaderboard" element={<Leaderboard />} />
					<Route path="/matchmaking" element={<Matchmaking />} />
					<Route path="*" element={<Navigate to="/" replace />} />

					{/* User Routes */}
					<Route element={<RequireAuth />}>
						<Route path="/chat" element={<Chat />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>

					{/* Admin Routes */}
						<Route path='/admin' element={<Admin />} />

				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	)
}

export default App
