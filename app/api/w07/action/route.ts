export async function POST() {
  return Response.json({ error: '이전 처리 경로는 종료했습니다. 새 심사 화면에서 증빙과 승인을 확인해 주세요.' }, { status: 410 })
}
