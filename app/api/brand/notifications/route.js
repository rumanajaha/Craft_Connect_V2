import { GET as sharedGET, PATCH as sharedPATCH, DELETE as sharedDELETE } from '../../notifications/route';

export async function GET(request) {
  return sharedGET(request);
}

export async function PATCH(request) {
  return sharedPATCH(request);
}

export async function DELETE(request) {
  return sharedDELETE(request);
}
