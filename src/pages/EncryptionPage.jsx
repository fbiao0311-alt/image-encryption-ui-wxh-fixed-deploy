import { Link } from 'react-router-dom'
import { useMemo, useRef, useState } from 'react'

export default function EncryptionPage() {
  const imageInputRef = useRef(null)
  const bitstreamInputRef = useRef(null)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [bitstreamFileName, setBitstreamFileName] = useState('')
  const [bitstreamText, setBitstreamText] = useState('')
  const [encryptedPreview, setEncryptedPreview] = useState('')
  const [decryptedPreview, setDecryptedPreview] = useState('')
  const [encryptedBytes, setEncryptedBytes] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const [encryptMetrics, setEncryptMetrics] = useState({
    entropy: '--',
    mse: '--',
    psnr: '--',
    ssim: '--',
  })

  const [decryptMetrics, setDecryptMetrics] = useState({
    mse: '--',
    psnr: '--',
    ssim: '--',
  })

  const [keyStats, setKeyStats] = useState({
    originalKeyLength: '--',
    startBit: 0,
    requiredBits: '--',
    bitsUsedFromOriginal: '--',
    bitsRemaining: '--',
    isReused: '--',
    reuseCycles: '--',
    lastCycleBits: '--',
  })

  const cleanedBitstream = useMemo(() => {
    return (bitstreamText || '').replace(/[^01]/g, '')
  }, [bitstreamText])

  const resetMetrics = () => {
    setEncryptMetrics({
      entropy: '--',
      mse: '--',
      psnr: '--',
      ssim: '--',
    })

    setDecryptMetrics({
      mse: '--',
      psnr: '--',
      ssim: '--',
    })

    setKeyStats({
      originalKeyLength: '--',
      startBit: 0,
      requiredBits: '--',
      bitsUsedFromOriginal: '--',
      bitsRemaining: '--',
      isReused: '--',
      reuseCycles: '--',
      lastCycleBits: '--',
    })
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setError('')
    setEncryptedPreview('')
    setDecryptedPreview('')
    setEncryptedBytes(null)
    resetMetrics()

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleBitstreamUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBitstreamFileName(file.name)
    setError('')
    setEncryptedPreview('')
    setDecryptedPreview('')
    setEncryptedBytes(null)
    resetMetrics()

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const cleaned = text.replace(/[^01]/g, '')
      setBitstreamText(cleaned)
    }
    reader.readAsText(file)
  }

  const loadImageElement = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const calculateEntropy = (rgbaData) => {
    const histogram = new Array(256).fill(0)

    for (let i = 0; i < rgbaData.length; i += 4) {
      histogram[rgbaData[i]] += 1
      histogram[rgbaData[i + 1]] += 1
      histogram[rgbaData[i + 2]] += 1
    }

    const total = (rgbaData.length / 4) * 3
    let entropy = 0

    for (let i = 0; i < 256; i += 1) {
      if (histogram[i] === 0) continue
      const p = histogram[i] / total
      entropy -= p * Math.log2(p)
    }

    return entropy.toFixed(4)
  }

  const calculateMSE = (a, b) => {
    let sum = 0
    let count = 0

    for (let i = 0; i < a.length; i += 4) {
      for (let c = 0; c < 3; c += 1) {
        const diff = a[i + c] - b[i + c]
        sum += diff * diff
        count += 1
      }
    }

    return count === 0 ? 0 : sum / count
  }

  const calculatePSNR = (mse) => {
    if (mse === 0) return Infinity
    return 10 * Math.log10((255 * 255) / mse)
  }

  const calculateSSIM = (a, b) => {
    const x = []
    const y = []

    for (let i = 0; i < a.length; i += 4) {
      const grayA = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]
      const grayB = 0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]
      x.push(grayA)
      y.push(grayB)
    }

    const n = x.length
    if (n === 0) return 0

    const meanX = x.reduce((s, v) => s + v, 0) / n
    const meanY = y.reduce((s, v) => s + v, 0) / n

    let varX = 0
    let varY = 0
    let covXY = 0

    for (let i = 0; i < n; i += 1) {
      varX += (x[i] - meanX) * (x[i] - meanX)
      varY += (y[i] - meanY) * (y[i] - meanY)
      covXY += (x[i] - meanX) * (y[i] - meanY)
    }

    varX /= n
    varY /= n
    covXY /= n

    const L = 255
    const C1 = (0.01 * L) ** 2
    const C2 = (0.03 * L) ** 2

    const numerator = (2 * meanX * meanY + C1) * (2 * covXY + C2)
    const denominator =
      (meanX * meanX + meanY * meanY + C1) * (varX + varY + C2)

    if (denominator === 0) return 0
    return numerator / denominator
  }

  const xorProcessImageData = (sourceData, key) => {
    const result = new Uint8ClampedArray(sourceData)
    const keyLength = key.length
    let bitIndex = 0

    for (let i = 0; i < result.length; i += 4) {
      for (let c = 0; c < 3; c += 1) {
        const value = result[i + c]
        const bits = value.toString(2).padStart(8, '0').split('')

        for (let b = 0; b < 8; b += 1) {
          const keyBit = key[bitIndex % keyLength]
          bits[b] = String(Number(bits[b]) ^ Number(keyBit))
          bitIndex += 1
        }

        result[i + c] = parseInt(bits.join(''), 2)
      }
    }

    return result
  }

  const buildKeyStats = (keyLength, requiredBits, startBit = 0) => {
    const bitsUsedFromOriginal = Math.min(requiredBits, Math.max(0, keyLength - startBit))
    const bitsRemaining = Math.max(0, keyLength - (startBit + bitsUsedFromOriginal))
    const isReused = keyLength < requiredBits
    const reuseCycles = isReused ? Math.floor(requiredBits / keyLength) : 0
    const lastCycleBits = isReused ? requiredBits % keyLength : 0

    return {
      originalKeyLength: keyLength,
      startBit,
      requiredBits,
      bitsUsedFromOriginal,
      bitsRemaining,
      isReused: isReused ? '是' : '否',
      reuseCycles,
      lastCycleBits,
    }
  }

  const handleEncrypt = async () => {
    setError('')

    if (!imagePreview) {
      setError('请先上传图片。')
      return
    }

    if (!cleanedBitstream) {
      setError('请先上传或输入比特流内容。')
      return
    }

    try {
      setIsProcessing(true)

      const img = await loadImageElement(imagePreview)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const originalData = new Uint8ClampedArray(imageData.data)
      const encryptedData = xorProcessImageData(originalData, cleanedBitstream)

      const encryptedImageData = new ImageData(
        encryptedData,
        canvas.width,
        canvas.height
      )
      ctx.putImageData(encryptedImageData, 0, 0)

      const encryptedUrl = canvas.toDataURL('image/png')

      setEncryptedPreview(encryptedUrl)
      setEncryptedBytes(encryptedData)
      setDecryptedPreview('')

      const mse = calculateMSE(originalData, encryptedData)
      const psnr = calculatePSNR(mse)
      const ssim = calculateSSIM(originalData, encryptedData)
      const entropy = calculateEntropy(encryptedData)

      setEncryptMetrics({
        entropy,
        mse: mse.toFixed(4),
        psnr: Number.isFinite(psnr) ? psnr.toFixed(4) : '∞',
        ssim: ssim.toFixed(4),
      })

      setDecryptMetrics({
        mse: '--',
        psnr: '--',
        ssim: '--',
      })

      const requiredBits = img.width * img.height * 3 * 8
      setKeyStats(buildKeyStats(cleanedBitstream.length, requiredBits, 0))
    } catch (err) {
      console.error(err)
      setError('加密失败，请检查图片或比特流。')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecrypt = async () => {
    setError('')

    if (!imagePreview) {
      setError('请先上传原始图片。')
      return
    }

    if (!cleanedBitstream) {
      setError('请先上传或输入比特流内容。')
      return
    }

    if (!encryptedBytes) {
      setError('请先完成加密。')
      return
    }

    try {
      setIsProcessing(true)

      const img = await loadImageElement(imagePreview)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const originalData = new Uint8ClampedArray(imageData.data)

      const decryptedData = xorProcessImageData(encryptedBytes, cleanedBitstream)

      const decryptedImageData = new ImageData(
        decryptedData,
        canvas.width,
        canvas.height
      )
      ctx.putImageData(decryptedImageData, 0, 0)

      const decryptedUrl = canvas.toDataURL('image/png')
      setDecryptedPreview(decryptedUrl)

      const mse = calculateMSE(originalData, decryptedData)
      const psnr = calculatePSNR(mse)
      const ssim = calculateSSIM(originalData, decryptedData)

      setDecryptMetrics({
        mse: mse.toFixed(4),
        psnr: Number.isFinite(psnr) ? psnr.toFixed(4) : '∞',
        ssim: ssim.toFixed(4),
      })
    } catch (err) {
      console.error(err)
      setError('解密失败，请重试。')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setImageFile(null)
    setImagePreview('')
    setBitstreamFileName('')
    setBitstreamText('')
    setEncryptedPreview('')
    setDecryptedPreview('')
    setEncryptedBytes(null)
    setError('')
    resetMetrics()

    if (imageInputRef.current) imageInputRef.current.value = ''
    if (bitstreamInputRef.current) bitstreamInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">任务二</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              图像加密与图像分析
            </h1>
          </div>

          <Link
            to="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            返回首页
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">输入区</h2>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  图片
                </label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50"
                >
                  {imageFile ? `已选择：${imageFile.name}` : '点击上传图片'}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  比特流文件
                </label>
                <div
                  onClick={() => bitstreamInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50"
                >
                  {bitstreamFileName
                    ? `已选择：${bitstreamFileName}`
                    : '点击上传比特流文件'}
                </div>
                <input
                  ref={bitstreamInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleBitstreamUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  比特流内容
                </label>
                <textarea
                  value={bitstreamText}
                  onChange={(e) => setBitstreamText(e.target.value)}
                  placeholder="请在此粘贴比特流……"
                  className="min-h-32 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  当前有效比特数：{cleanedBitstream.length}
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleEncrypt}
                  disabled={isProcessing}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isProcessing ? '处理中...' : '开始加密'}
                </button>

                <button
                  onClick={handleDecrypt}
                  disabled={isProcessing}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isProcessing ? '处理中...' : '开始解密'}
                </button>

                <button
                  onClick={handleReset}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  重置
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">结果区</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">信息熵</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {encryptMetrics.entropy}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">均方误差 MSE</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {encryptMetrics.mse}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">峰值信噪比 PSNR</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {encryptMetrics.psnr}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">结构相似性 SSIM</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {encryptMetrics.ssim}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">原始图像</p>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="原始图像"
                    className="h-52 w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                    暂无原始图像
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">加密图像</p>
                {encryptedPreview ? (
                  <div className="space-y-4">
                    <img
                      src={encryptedPreview}
                      alt="加密图像"
                      className="h-52 w-full rounded-lg object-contain"
                    />
                    <a
                      href={encryptedPreview}
                      download="encrypted_image.png"
                      className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      下载加密图像
                    </a>
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                    暂无加密图像
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">解密图像</p>
                {decryptedPreview ? (
                  <div className="space-y-4">
                    <img
                      src={decryptedPreview}
                      alt="解密图像"
                      className="h-52 w-full rounded-lg object-contain"
                    />
                    <a
                      href={decryptedPreview}
                      download="decrypted_image.png"
                      className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      下载解密图像
                    </a>
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                    暂无解密图像
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">加密分析结果</p>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    信息熵: {encryptMetrics.entropy}
                  </div>
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    MSE: {encryptMetrics.mse}
                  </div>
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    PSNR: {encryptMetrics.psnr}
                  </div>
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    SSIM: {encryptMetrics.ssim}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm font-medium text-slate-700">解密分析结果</p>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    MSE: {decryptMetrics.mse}
                  </div>
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    PSNR: {decryptMetrics.psnr}
                  </div>
                  <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                    SSIM: {decryptMetrics.ssim}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <p className="mb-4 text-sm font-medium text-slate-700">Key 信息统计</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  原始 key 长度: {keyStats.originalKeyLength} bits
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  起始位位置: {keyStats.startBit}
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  加密所需总位数: {keyStats.requiredBits} bits
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  使用的原始 key 位数: {keyStats.bitsUsedFromOriginal} bits
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  剩余未使用位数: {keyStats.bitsRemaining} bits
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  是否发生复用: {keyStats.isReused}
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  复用轮数: {keyStats.reuseCycles}
                </div>
                <div className="rounded-lg bg-white p-4 text-slate-700 shadow-sm">
                  最后一轮使用位数: {keyStats.lastCycleBits} bits
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
