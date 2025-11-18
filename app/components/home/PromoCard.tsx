import { Link } from 'react-router';

export function PromoCard() {
  return (
    <div className="relative mx-4 mb-6 rounded-2xl overflow-hidden h-36 shadow-xl">
      <img
        src="https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800"
        alt="بيع محاصيلك"
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 flex items-center p-5">
        {/* Left side - Button */}
        <div className="flex-shrink-0">
          <Link
            to="/direct/new"
            className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-lg inline-block hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="text-sm text-white font-bold">اعرض منتجات ايضا</span>
          </Link>
        </div>

        {/* Right side - Text content */}
        <div className="flex-1 text-right mr-5">
          <h3 className="mb-2 text-white text-2xl font-bold leading-tight drop-shadow-lg">
            بيع محاصيلك
          </h3>
          <p className="text-white text-lg font-semibold leading-tight mb-1 drop-shadow-md">
            بسرعة وبريح عالي
          </p>
          <p className="text-white text-lg font-semibold leading-tight drop-shadow-md">
            وبسوق واي
          </p>
        </div>
      </div>
    </div>
  );
}

