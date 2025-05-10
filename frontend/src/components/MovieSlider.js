import React from "react";
import { Box } from "@chakra-ui/react";
import MovieCard from "./MovieCard";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow"; // Một hiệu ứng ví dụ

// import required modules
import {
  EffectCoverflow,
  Pagination,
  Navigation,
  Autoplay,
} from "swiper/modules";

const MovieSlider = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <Box w="100%" py={4} position="relative">
      {" "}
      {/* position relative cho navigation buttons */}
      <Swiper
        effect={"coverflow"} // Hiệu ứng trượt qua, có thể chọn 'slide', 'fade', 'cube', 'flip'
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"} // Hoặc một số cụ thể, 'auto' tốt cho coverflow
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        loop={true} // Lặp lại slider
        autoplay={{
          delay: 4000, // Thời gian tự động chuyển slide (ms)
          disableOnInteraction: false, // Không dừng autoplay khi người dùng tương tác
        }}
        pagination={{
          clickable: true, // Cho phép click vào pagination dots
          dynamicBullets: true, // Pagination dots động
        }}
        navigation={true} // Hiển thị nút Next/Prev
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="movieSwiper" // Class tùy chỉnh nếu cần style thêm
        style={{
          // CSS cho các nút navigation (ví dụ)
          "--swiper-navigation-color": "#FF8C00", // Màu cam (brand.accent)
          "--swiper-pagination-color": "#FF8C00", // Màu cam
          "--swiper-navigation-size": "30px", // Kích thước nút
        }}
        breakpoints={{
          // Cấu hình responsive
          320: {
            slidesPerView: 1.5,
            spaceBetween: 10,
            coverflowEffect: { rotate: 30, stretch: 0, depth: 80, modifier: 1 },
          },
          480: {
            slidesPerView: 2.2,
            spaceBetween: 15,
            coverflowEffect: { rotate: 40, stretch: 0, depth: 90, modifier: 1 },
          },
          640: {
            slidesPerView: 2.8,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 3.5,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4.5,
            spaceBetween: 25,
          },
          1280: {
            slidesPerView: 5.2,
            spaceBetween: 30,
          },
        }}
      >
        {movies.map((movie, index) => (
          <SwiperSlide
            key={movie._id || movie.slug || index}
            style={{ width: "auto", minWidth: "200px", maxWidth: "260px" }}
          >
            {/* Đảm bảo MovieCard có thể co giãn hoặc có kích thước cố định phù hợp */}
            <Box height="100%">
              {" "}
              {/* Đảm bảo slide chiếm đủ chiều cao */}
              <MovieCard movie={movie} />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default MovieSlider;
