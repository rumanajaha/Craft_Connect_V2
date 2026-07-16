import { GET as sharedGET, POST as sharedPOST, PATCH as sharedPATCH } from '../../../messages/[id]/route';

export async function GET(request, context) {
  return sharedGET(request, context);
}

export async function POST(request, context) {
  return sharedPOST(request, context);
}

export async function PATCH(request, context) {
  return sharedPATCH(request, context);
}
