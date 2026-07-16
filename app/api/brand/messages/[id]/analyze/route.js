import { POST as sharedPOST } from '../../../../messages/[id]/analyze/route';

export async function POST(request, context) {
  return sharedPOST(request, context);
}
