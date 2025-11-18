import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonLabel?: string;
}

export interface BannerCarouselProps {
  data: Banner[];
  onBannerPress?: (bannerId: string) => void;
}

export function BannerCarousel({ data, onBannerPress }: BannerCarouselProps) {
  return (
    <div className="my-3">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-gray-300',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-green-600',
        }}
        className="!h-24 rounded-2xl overflow-hidden"
      >
        {data.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="relative h-full rounded-2xl overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-between px-4 py-4">
                {/* Text Container - Right */}
                <div className="text-right">
                  <h3 className="text-green-400 text-2xl font-bold mb-1 line-clamp-1 drop-shadow-lg">
                    {banner.title}
                  </h3>
                  <p className="text-white text-sm font-medium line-clamp-1 drop-shadow-md">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Action Button - Left */}
                <button
                  onClick={() => onBannerPress?.(banner.id)}
                  className="bg-gradient-to-r from-emerald-700 to-green-700 px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:from-emerald-800 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {banner.buttonLabel || 'اعرف المزيد'}
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

