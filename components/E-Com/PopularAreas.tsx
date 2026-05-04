import Image from "next/image";

export default function PopularAreas() {
  const areas = [
    {
      name: "Kato Paphos",
      listings: 4,
      img: "https://images.pexels.com/photos/240526/pexels-photo-240526.jpeg",
    },
    {
      name: "Geroskipou",
      listings: 3,
      img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg",
    },
    {
      name: "Pegeia",
      listings: 4,
      img: "https://images.pexels.com/photos/1685167/pexels-photo-1685167.jpeg",
    },
    {
      name: "Paphos Town",
      listings: 4,
      img: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg",
    },
    {
      name: "Polis Chrysochous",
      listings: 4,
      img: "https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg",
    },
    {
      name: "Ktima",
      listings: 1,
      img: "https://images.pexels.com/photos/161164/pexels-photo-161164.jpeg",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">Popular areas in Paphos</h2>
      <p className="text-gray-500 mb-8">to have the perfect holiday</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {areas.map((area) => (
          <div key={area.name} className="group cursor-pointer">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3">
              <Image
                width={1000}
                height={1000}
                src={area.img}
                alt={area.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </div>
            <h4 className="font-bold text-sm">{area.name}</h4>
            <p className="text-xs text-gray-500">{area.listings} listings</p>
          </div>
        ))}
      </div>
    </section>
  );
}
