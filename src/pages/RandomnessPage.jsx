 
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { buildApiUrl } from '../lib/api'

export default function RandomnessPage() {
  const [bitstreamFile, setBitstreamFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const heatmapSrc = result?.heatmap_url ? buildApiUrl(result.heatmap_url) : ''
  const acfSrc = result?.acf_plot_url ? buildApiUrl(result.acf_plot_url) : ''
  const acfExcelUrl = result?.acf_excel_url ? buildApiUrl(result.acf_excel_url) : ''



  const handleFileChange = (e) => {
    const file = e.target.files[0] || null
    setBitstreamFile(file)
    setError('')
  }

  const handleStartDetect = async () => {
    if (!bitstreamFile) {
      setError('请先上传一个 txt 文件')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('bitstream_file', bitstreamFile)

      const response = await fetch(buildApiUrl('/api/task1/randomness/analyze-file'), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || '后端返回失败')
      }

      setResult(data.data)
    } catch (err) {
      setError(err.message || '请求失败，请检查后端是否还在运行')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setBitstreamFile(null)
    setResult(null)
    setError('')
    const fileInput = document.getElementById('bitstream-file-input')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">任务一</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              真随机数检测
            </h1>
          </div>

          <Link
            to="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            返回首页
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">输入区</h2>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  比特流文件
                </label>

                <input
                  id="bitstream-file-input"
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700"
                />

                {bitstreamFile && (
                  <p className="mt-2 text-sm text-slate-500">
                    已选择文件：{bitstreamFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  比特流内容
                </label>
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  当前阶段先使用 txt 文件上传，文本输入下一步再接。
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleStartDetect}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? '检测中...' : '开始检测'}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">结果区</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">香农熵</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {result ? result.entropy : '--'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">比特流长度</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {result ? result.total_bits : '--'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">0/1 比例</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {result ? result.ratio_text : '--'}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                 {heatmapSrc ? (
                  <div>
                    <img
                      src={heatmapSrc}
                      alt="热图"
                      className="w-full rounded-lg border border-slate-200"
                    />
                    <p className="mt-3 text-xs text-slate-500">
                      热图尺寸：{result.heatmap_rows} × {result.heatmap_cols}，
                      用于绘图的比特数：{result.heatmap_bits_used}
                    </p>
                  </div>
                ) : (
                  '热图预览区（下一步接入）'
                )}
              </div>
             
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                {acfSrc ? (
                  <div>
                    <img
                      src={acfSrc}
                      alt="ACF 图"
                      className="w-full rounded-lg border border-slate-200"
                    />

                    <p className="mt-3 text-xs text-slate-500">
                      最大 Lag：{result.acf_max_lag}，95% 置信区间：±{result.acf_confidence_interval}，
                      ACF 点数：{result.acf_lag_points}
                    </p>
                
                    {acfExcelUrl && (
                      <a
                        href={acfExcelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-600 border border-slate-300 hover:bg-slate-100"
                      >
                        下载 ACF 数据表
                      </a>
                    )}
                  </div>
                ) : (
                  '自相关函数图表区（下一步接入）'
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              {result
                ? `检测完成：共读取 ${result.total_bits} 位比特流，0 的数量为 ${result.count_0}，1 的数量为 ${result.count_1}。ACF 最大 Lag 为 ${result.acf_max_lag}，95% 置信区间为 ±${result.acf_confidence_interval}。`
                : '随机性评估结果区'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
