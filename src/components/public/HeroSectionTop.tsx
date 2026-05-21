import Image from "next/image";
import Container from "./Container";
import TopBackground from "./TopBackground";
import TopBackgroundSub from "./TopBackgroundSub";

interface PageNameProps {
  pageName?: string;
}
export default function HeroSectionTop({ pageName }: PageNameProps) {
  return (
    <div className="relative h-full min-h-lvh overflow-hidden" id="home">
      {/* <TopBackground imageUrl="top_back3.jpg" startScrollY={600} /> */}
      <TopBackgroundSub imageUrl="top_back5.jpg" />
      <Container>
        <div className="relative pt-60 ml-auto">
          <div className="lg:w-2/3 text-center mx-auto">
          <div id="hiro-titel" className="font-racing-sans-one">
            {/* <h1 className="text-primary text-4xl font-bold lg:text-9xl mb-6">Adlib Go</h1> */}
            <div className="w-auto h-48 bg-[url('/images/main_logo.svg')] bg-center bg-no-repeat"></div>
            <h2 className="text-secondary text-balance text-5xl">
              Website for groups that enjoy<span className="text-accent"> jazz sessions.</span>
            </h2>
          </div>
            <p className="mt-8 text-2xl text-background">ジャズの世界にどっぷり浸かる体験にぜひご参加ください。</p>
            <div className="mt-20 flex flex-wrap justify-center gap-y-4 gap-x-6">
              <a
                href="#"
                className="relative flex h-11 w-full items-center justify-center px-6 rounded-full sm:w-max bg-primary"
              >
                <span className="relative text-base font-semibold text-on-primary">会員ログイン</span>
              </a>
              <a
                href="#"
                className="relative flex h-11 w-full items-center justify-center px-6 rounded-full sm:w-max bg-primary"
              >
                <span className="relative text-base font-semibold text-on-primary">会員登録</span>
              </a>
            </div>
              {pageName && <h3 className="text-white text-3xl mt-4">{pageName}</h3>}
          </div>
          {/* <div className="mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            <div className="p-4 grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/microsoft.svg" className="h-12 w-auto mx-auto" alt="client logo" width={144} height={48} />
            </div>
            <div className="p-4 grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/airbnb.svg" className="h-12 w-auto mx-auto" alt="client logo" width={144} height={48} />
            </div>
            <div className="p-4 flex grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/google.svg" className="h-9 w-auto m-auto" alt="client logo" width={144} height={36} />
            </div>
            <div className="p-4 flex grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/google-cloud.svg" className="h-9 w-auto m-auto" alt="client logo" width={144} height={36} />
            </div>
            <div className="p-4 flex grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/ge.svg" className="h-9 w-auto m-auto" alt="client logo" width={144} height={36} />
            </div>
            <div className="p-4 flex grayscale transition duration-200 hover:grayscale-0">
              <Image src="/images/clients/netflix.svg" className="h-9 w-auto m-auto" alt="client logo" width={144} height={36} />
            </div>
          </div> */}
        </div>
      </Container>
    </div>
  );
}
