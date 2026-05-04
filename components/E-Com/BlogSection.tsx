import Image from "next/image";

export default function BlogSection() {
  const posts = [
    {
      title: "Activities in Cyprus",
      date: "October 31, 2022",
      img: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg",
    },
    {
      title: "Learn about Cyprus",
      date: "October 27, 2022",
      img: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg",
    },
    {
      title: "The most beautiful beaches",
      date: "April 21, 2015",
      img: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg",
    },
    {
      title: "Eat like a local",
      date: "April 21, 2015",
      img: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg",
    },
    {
      title: "5 Things to do in Paphos",
      date: "April 21, 2015",
      img: "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-8">
        Read from our blog and plan holiday adventures
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {posts.map((post) => (
          <article key={post.title} className="group cursor-pointer">
            <div className="aspect-video rounded-xl overflow-hidden mb-4">
              <Image
                width={1000}
                height={1000}
                src={post.img}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h3 className="font-bold text-sm mb-2 group-hover:text-[#ff6b35] transition-colors">
              {post.title}
            </h3>
            <p className="text-[10px] text-gray-400 mb-2">
              Located just 30 minutes from the Seychelles International Airport
              and...
            </p>
            <p className="text-[10px] font-medium uppercase text-gray-300">
              published on {post.date}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
