import { useState, useEffect } from 'react';

export function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className={`rounded-xl p-4 ${isExpired ? "bg-gray-400" : "bg-red-600"}`}>
      <p className="mb-2 text-base text-center text-white font-bold">
        {isExpired ? "انتهى المزاد" : "الوقت المتبقي"}
      </p>
      {!isExpired && (
        <div className="flex flex-row gap-2 justify-center items-center dir-ltr">
           <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <span className="text-2xl text-white font-bold leading-none">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="text-xs text-white">يوم</span>
          </div>
          <span className="text-2xl text-white font-bold">:</span>
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <span className="text-2xl text-white font-bold leading-none">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-xs text-white">ساعة</span>
          </div>
          <span className="text-2xl text-white font-bold">:</span>
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <span className="text-2xl text-white font-bold leading-none">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-xs text-white">دقيقة</span>
          </div>
          <span className="text-2xl text-white font-bold">:</span>
          <div className="flex flex-col items-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
            <span className="text-2xl text-white font-bold leading-none">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-white">ثانية</span>
          </div>
        </div>
      )}
    </div>
  );
}

