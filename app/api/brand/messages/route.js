import { GET as sharedGET, POST as sharedPOST } from '../../messages/route';

export async function GET(request) {
  return sharedGET(request);
}

export async function POST(request) {
  return sharedPOST(request);
}
