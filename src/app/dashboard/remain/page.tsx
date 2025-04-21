import Link from 'next/link';
import { Clock, Book, ArrowRight } from "lucide-react";
import { getUserFromSession } from '@/auth/auth';
import { getRemainingBooks } from '@/libs/supabase/server/storage';
import { RemainBook } from '@/libs/types';
import { title } from 'process';

export default async function Remain() {
  // jwt()→sesion()→dbよりuserオブジェクトを取得。
  const user = await getUserFromSession();
  // m3のトークンを取得
  const token = user.token_info.token;
  // supabaseのstorageから削除されていないフォルダを抽出し、そこからidを取得→m3からタイトルやページ数、残り時間などの情報を取得
  const remainBooks: RemainBook[] = await getRemainingBooks(token);
  const remainLength = remainBooks.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 bg-white/80 backdrop-blur rounded-lg shadow-lg p-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <Book className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
              ダウンロード途中の本
              <span className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-600 rounded-full text-base sm:text-lg">
                {remainLength}冊
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 pt-4">ダウンロードを再開するには本のタイトルをクリックしてください</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remainBooks.map(book => {
            const progress = Math.round((book.endPage / book.total_images) * 100);
            const remainingPages = book.total_images - book.endPage;
            const timeLeft = book.timeleft;
            
            return (
              <div key={book.title} className="group bg-white/90 backdrop-blur rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-lg font-medium group-hover:text-blue-600 transition-colors mb-4 flex-shrink-0">
                    <Link href={`/dashboard/download?title=${encodeURIComponent(book.title)}&id=${book.bookId}`} 
                          className="flex items-center justify-between">
                      <span className="line-clamp-2 min-h-[3rem]">{book.title}</span>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                  </h2>
                  <div className="space-y-4 flex-grow flex flex-col justify-end">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">進捗状況</span>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Book className="w-4 h-4 text-gray-500" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-gray-900">{remainingPages}ページ</div>
                          <div className="text-xs text-gray-500">残りページ数</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-gray-900">{timeLeft}秒</div>
                          <div className="text-xs text-gray-500">残り時間</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
