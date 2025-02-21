export default function Dashboard() {
  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gray-100 flex items-start sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full space-y-6 mt-4 sm:mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">ログイン情報</h1>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
            <p className="text-sm text-gray-500 mb-1 sm:mb-2">アカウント</p>
            <p className="text-base sm:text-lg font-medium text-gray-900">hypoisbest@gmail.com</p>
          </div>
          
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
            <p className="text-sm text-gray-500 mb-1 sm:mb-2">パスワード</p>
            <p className="text-base sm:text-lg font-medium text-gray-900">hashima2025</p>
          </div>
        </div>

        <a 
          href="https://drive.google.com/drive/my-drive"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl text-center transition duration-300 text-sm sm:text-base w-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Driveへ
        </a>
      </div>
    </div>
  )
}

