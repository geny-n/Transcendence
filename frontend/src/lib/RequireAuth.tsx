import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../main";

function RequireAuth() {
    const { user } = useAuth();

    if (user === undefined) {
        return <div>Loading...</div>;
    }
    if (!user){
        return <Navigate to="/login" replace />;
    }

    return <Outlet/>;
}
export default RequireAuth;

