const config = {
  apiBaseUrl: process.env.NODE_ENV === "production"
    ? "https://chess-research-pragma-backend.azurewebsites.net"
    : "http://localhost:5001"
};

export default config;
