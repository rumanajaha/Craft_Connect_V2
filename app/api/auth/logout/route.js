import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout successful" });
  
  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/"
  });
  
  response.cookies.set("sb-access-token", "", {
    path: "/",
    expires: new Date(0)
  });
  
  response.cookies.set("sb-refresh-token", "", {
    path: "/",
    expires: new Date(0)
  });
  
  return response;
}
