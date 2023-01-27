import AuthUtils from "../../utils/auth/auth.utils";

export default function endpointGuard(req, res, next) {
  async function handleRequest() {

    let accessToken

    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
       accessToken = req.headers.authorization.split(" ")[1];

      if (accessToken === null || accessToken === undefined) {
        throw new Error._401("Missing required access token.");
      }
    } else {
      throw new Error._400("Invalid token.");
    }




    let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

    let clientId = decodedToken.clientId;

    if(req.originalUr){}
  

  }
  handleRequest();
}
