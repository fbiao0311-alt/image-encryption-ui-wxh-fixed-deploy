import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 px-6 py-12 flex items-center justify-center">
      <div className="w-full max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium tracking-wider text-blue-600">
            
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            随机数与双图像加密分析平台
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            请选择一个任务进入对应的分析界面。
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Link
            to="/randomness"
            className="group flex min-h-[360px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  任务一
                </div>
                <span className="text-sm text-slate-400 transition group-hover:text-emerald-600">
                  进入
                </span>
              </div>

              <h2 className="mt-8 text-3xl font-bold text-slate-900">
                真随机数检测
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                上传或粘贴一组比特流，进入热图、香农熵计算与自相关函数分析的可视化界面。
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">输入内容</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  1 组比特流
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">输出内容</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  热图 / 香农熵 / 自相关函数分析
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/encryption"
            className="group flex min-h-[360px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  任务二
                </div>
                <span className="text-sm text-slate-400 transition group-hover:text-blue-600">
                  进入
                </span>
              </div>

              <h2 className="mt-8 text-3xl font-bold text-slate-900">
                双图像加密与图像分析
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                上传两张图片和一组比特流，进入双图像加密、统计学分析、保真度分析与鲁棒性测试的可视化界面。
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">输入内容</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  2 张图片 + 1 组比特流
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">输出内容</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  加密结果与图像分析
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
