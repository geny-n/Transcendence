import { verifyToken } from "../utils/helpers.js";
export async function authenticateToken(request, response, next) {
    // Chercher le token dans les cookies ou le header
    const token = request.cookies?.access_token;
    console.log("token:", token);
    if (!token) {
        return response.status(401).json({
            success: false,
            message: "Access denied. Token missing."
        });
    }
    // verifier le token
    const decoded = verifyToken(token);
    console.log("decoded:", decoded);
    if (!decoded) {
        return response.status(403).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
    // ajouter l'ID de l'utilisateur a la requete
    request.userId = decoded.userId;
    next();
}
//# sourceMappingURL=auth.js.map