import { formatCurrency } from '@/lib/utils'

interface ProductInfoCardProps {
  data: {
    productName: string
    price: number | string
    category: string
    minOrder: number | string
    shippingFee: number | string
    imageUse: boolean
    mainImage: string
    subImages: string[]
    summary: string
    detailImages: string[]
    detailHtml?: string
    supplierName?: string
    supplierContact?: string
    supplierEmail?: string
    supplierAddress?: string
    supplierBizNo?: string
    options?: { name: string; type?: string; values: string[] }[]
    productNo?: string
  }
}

export default function ProductInfoCard({ data }: ProductInfoCardProps) {
  const thumbs = data.subImages || []
  const detailImgs = (data.detailImages && data.detailImages.length > 0 ? data.detailImages : []) || thumbs
  const supplierAvailable = Boolean(
    data.supplierName || data.supplierContact || data.supplierEmail || data.supplierAddress || data.supplierBizNo
  )
  const optionAvailable = Array.isArray(data.options) && data.options.length > 0

  return (
    <div className="card bg-slate-900/70 border-slate-800 space-y-4 w-full max-w-5xl mx-auto">
      <h3 className="text-lg font-semibold text-white">상품 정보</h3>

      <div className="space-y-4">
        {/* 상단 정보 영역 */}
        <div className="space-y-2">
          <p className="text-2xl font-bold text-white leading-snug break-words">{data.productName}</p>
          <p className="text-blue-400 font-semibold">
            도매가: {data.price ? formatCurrency(Number(data.price)) : '입력 필요'}
          </p>
          <p className="text-sm text-slate-200">카테고리: {data.category || '-'}</p>
          {data.productNo && <p className="text-sm text-slate-200">상품번호: {data.productNo}</p>}
          <p className="text-sm text-slate-200">최소 주문 수량: {data.minOrder || '-'}개</p>
          <p className="text-sm text-slate-200">배송비: {data.shippingFee ? formatCurrency(Number(data.shippingFee)) : '확인 필요'}</p>
          <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${data.imageUse ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {data.imageUse ? '이미지 사용 가능' : '이미지 사용 불가'}
          </span>
          <div className="mt-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1 text-sm text-slate-200">
            <p className="font-medium text-slate-100">공급사 정보</p>
            {supplierAvailable ? (
              <>
                {data.supplierName && <p>공급사명: {data.supplierName}</p>}
                {data.supplierContact && <p>문의번호: {data.supplierContact}</p>}
                {data.supplierEmail && <p>이메일: {data.supplierEmail}</p>}
                {data.supplierBizNo && <p>사업자등록번호: {data.supplierBizNo}</p>}
                {data.supplierAddress && <p>주소: {data.supplierAddress}</p>}
              </>
            ) : (
              <p className="text-slate-400">공급사 정보를 가져오지 못했습니다.</p>
            )}
          </div>

          <div className="mt-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1 text-sm text-slate-200">
            <p className="font-medium text-slate-100">옵션 정보 (도매꾹)</p>
            {optionAvailable ? (
              data.options!.map((opt, idx) => (
                <div key={idx} className="border border-slate-700/60 rounded-md p-2 mb-1 last:mb-0 bg-slate-900/60">
                  <p className="text-slate-100 text-sm font-semibold">
                    {opt.name} {opt.type ? <span className="text-slate-500 text-xs">({opt.type})</span> : null}
                  </p>
                  <p className="text-xs text-slate-400 break-words">
                    {opt.values && opt.values.length > 0 ? opt.values.join(', ') : '값 없음'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-400">옵션을 찾지 못했습니다.</p>
            )}
          </div>
        </div>

        {/* 이미지 + 썸네일 + 요약 */}
        <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-6 w-full">
          <div className="w-full lg:w-1/2 flex-shrink-0 flex flex-col gap-3 min-w-0">
            <div className="w-full max-w-[420px] mx-auto aspect-[4/5] max-h-[320px] rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden flex items-center justify-center">
              {data.mainImage ? (
                <img src={data.mainImage} alt={data.productName} className="h-full w-full object-contain" />
              ) : (
                <div className="flex items-center justify-center text-slate-500 py-16">이미지 없음</div>
              )}
            </div>
            {/* 썸네일 표시를 제거하여 중복 노출 방지 */}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-3 min-w-0">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-2 h-full">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200 font-medium">상세 설명 (요약)</p>
                <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${data.imageUse ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {data.imageUse ? '이미지 사용 가능' : '이미지 사용 불가'}
                </span>
              </div>
              <div className="rounded-md bg-slate-100 text-slate-800 p-3 text-sm leading-relaxed min-h-[120px]">
                {data.summary || '요약 정보가 없습니다.'}
              </div>
            </div>
          </div>
        </div>

        {/* 상세 설명 (원문) 이미지 스크롤 */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-200 font-medium">상세 설명 (원문)</p>
            <span className="text-xs text-slate-500">스크롤로 확인</span>
          </div>
          <div className="h-[440px] overflow-y-auto overflow-x-hidden border rounded-lg p-2 bg-white">
            {detailImgs.length > 0 ? (
              detailImgs.map((img, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <img
                    src={img}
                    alt={`상세 이미지 ${idx + 1}`}
                    className="w-full h-auto max-w-full object-contain rounded-md"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">상세 이미지가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
