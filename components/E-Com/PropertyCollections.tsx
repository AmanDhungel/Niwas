import Image from "next/image";

export default function PropertyCollections() {
  const collections = [
    {
      title: "Apartment",
      count: 4,
      size: "col-span-2 row-span-2",
      img: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg",
    },
    {
      title: "Bungalow",
      count: 3,
      size: "col-span-1 row-span-1",
      img: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg",
    },
    {
      title: "Condos",
      count: 4,
      size: "col-span-1 row-span-1",
      img: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
    },
    {
      title: "House",
      count: 2,
      size: "col-span-1 row-span-1",
      img: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
    },
    {
      title: "Villa",
      count: 2,
      size: "col-span-1 row-span-1",
      img: "https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg",
    },
    {
      title: "Loft",
      count: 3,
      size: "col-span-2 row-span-1",
      img: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-8">
        The properties you must book for your next vacation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
        {collections.map((item) => (
          <div
            key={item.title}
            className={`${item.size} relative group overflow-hidden rounded-2xl cursor-pointer`}>
            <Image
              width={1000}
              height={1000}
              src={item.img}
              alt={item.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-xs opacity-80 mb-1">{item.count} Listings</p>
              <h3 className="text-xl font-bold">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
