import './App.css'
import Navbar from './Components/Navbar/Navbar'
import HomeP from './Pages/HomePage'
import Pong from './Pages/Pong'
import PongMulti from './Pages/PongMulti'
import ScoreB from './Pages/ScoreBoard'
import Leaderboard from './Pages/Leaderboard'
import Teams from './Pages/Teams'
import Chat from './Pages/Chat'
import Profile from './Pages/Profile'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Matchmaking from './Pages/Matchmaking'
import Admin from './Pages/Admin'
import About from './Pages/About'
import { SocketProvider } from './socket.tsx'
import {Routes, Route, Outlet, Navigate } from "react-router-dom"
// import RequireAuth  from "./lib/RequireAuth";
// import RequireAdmin from "./lib/RequireAdmin";
// import RequireVisitor from "./lib/RequireVisitor";
// import NotFound from './Components/NotFound.tsx';


function App() {
	return (
		<>
			<Navbar />
			<Routes>

				{/* <Route element={<RequireVisitor />}> */}
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
				{/* </Route> */}

				{/* Protected Routes */}
				<Route element={<SocketProvider><Outlet/></SocketProvider>}>

					{/* Public Routes */}
					<Route path="/" element={<HomeP />} />
					<Route path='/about' element={<About />}></Route>

					{/* User Routes */}
					{/* <Route element={<RequireAuth />}> */}
						<Route path="/pong" element={<Pong />} />
						<Route path="/pong-multi" element={<PongMulti />} />
						<Route path="/scoreBoard" element={<ScoreB />} />
						<Route path="/leaderboard" element={<Leaderboard />} />
						<Route path="/teams" element={<Teams />} />
						<Route path="/chat" element={<Chat />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/matchmaking" element={<Matchmaking />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					{/* </Route> */}

					{/* Admin Routes */}
					{/* <Route element={<RequireAdmin />}> */}
						<Route path='/admin' element={<Admin />}/>
					{/* </Route> */}

				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	)
}

export default App
