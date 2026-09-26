import Script from "next/script";

/** 財富自由計算機的 Clarity 專案。編號會出現在網頁裡，與 GA 測量編號相同，不是密鑰。 */
const CLARITY_PROJECT_ID = "ynviame01x";

/** 免費熱圖與操作重播。點哪一格、捲到哪裡，在 clarity.microsoft.com 看。 */
export function ClarityAnalytics() {
  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
