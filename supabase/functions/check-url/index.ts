import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckUrlRequest {
  url: string;
}

interface CheckUrlResponse {
  statusCode: number;
  responseTimeMs: number;
  error?: string;
  screenshotData?: string;
}

async function captureScreenshot(url: string): Promise<string | undefined> {
  try {
    const apiKey = '1497ce55c7d04bc0880085784f71b2c5';

    const apiFlashUrl = new URL('https://api.apiflash.com/v1/urltoimage');
    apiFlashUrl.searchParams.append('access_key', apiKey);
    apiFlashUrl.searchParams.append('url', url);
    apiFlashUrl.searchParams.append('width', '1920');
    apiFlashUrl.searchParams.append('height', '1080');
    apiFlashUrl.searchParams.append('format', 'png');
    apiFlashUrl.searchParams.append('fresh', 'true');
    apiFlashUrl.searchParams.append('full_page', 'false');
    apiFlashUrl.searchParams.append('response_type', 'image');
    apiFlashUrl.searchParams.append('wait_until', 'page_loaded');
    apiFlashUrl.searchParams.append('delay', '2');

    const response = await fetch(apiFlashUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok && response.body) {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      return base64;
    }

    console.error('ApiFlash response not OK:', response.status, await response.text());
    return undefined;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url }: CheckUrlRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "URL-Monitor/1.0",
        },
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Math.round(performance.now() - startTime);

      let screenshotData: string | undefined;

      if (response.status < 200 || response.status >= 300) {
        try {
          screenshotData = await captureScreenshot(url);
        } catch (err) {
          console.error('Screenshot generation error:', err);
        }
      }

      const result: CheckUrlResponse = {
        statusCode: response.status,
        responseTimeMs,
        screenshotData,
      };

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const responseTimeMs = Math.round(performance.now() - startTime);

      let statusCode = 500;
      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          statusCode = 408;
          errorMessage = "Request timeout";
        } else if (error.message.includes("ConnectionRefused") || error.message.includes("Failed to fetch")) {
          statusCode = 503;
          errorMessage = "Connection refused or network error";
        } else {
          errorMessage = error.message;
        }
      }

      let screenshotData: string | undefined;

      try {
        screenshotData = await captureScreenshot(url);
      } catch (err) {
        console.error('Screenshot generation error:', err);
      }

      const result: CheckUrlResponse = {
        statusCode,
        responseTimeMs,
        error: errorMessage,
        screenshotData,
      };

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});