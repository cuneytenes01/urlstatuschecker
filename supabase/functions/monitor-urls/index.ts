import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MonitoredUrl {
  id: string;
  url: string;
  name: string | null;
  last_status_code: number | null;
  check_interval_minutes: number;
  last_check_at: string | null;
}

interface CheckResult {
  statusCode: number;
  responseTimeMs: number;
  error?: string;
  screenshotData?: string;
}

async function checkUrl(url: string): Promise<CheckResult> {
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

    return {
      statusCode: response.status,
      responseTimeMs,
    };
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

    return {
      statusCode,
      responseTimeMs,
      error: errorMessage,
    };
  }
}

function isHealthy(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

function shouldAlert(currentStatus: number): boolean {
  return !isHealthy(currentStatus);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: urls, error: fetchError } = await supabase
      .from("monitored_urls")
      .select("id, url, name, last_status_code, check_interval_minutes, last_check_at")
      .eq("is_active", true)
      .order("last_check_at", { ascending: true, nullsFirst: true })
      .limit(100);

    if (fetchError) {
      console.error("Error fetching URLs:", fetchError);
      throw fetchError;
    }

    if (!urls || urls.length === 0) {
      return new Response(
        JSON.stringify({ message: "No URLs to monitor", checked: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const now = new Date();
    const results = [];

    for (const monitoredUrl of urls as MonitoredUrl[]) {
      const lastCheck = monitoredUrl.last_check_at ? new Date(monitoredUrl.last_check_at) : null;
      const minutesSinceLastCheck = lastCheck
        ? (now.getTime() - lastCheck.getTime()) / 60000
        : Infinity;

      if (minutesSinceLastCheck < monitoredUrl.check_interval_minutes) {
        continue;
      }

      const checkResult = await checkUrl(monitoredUrl.url);

      await supabase
        .from("monitored_urls")
        .update({
          last_status_code: checkResult.statusCode,
          last_check_at: now.toISOString(),
          last_response_time_ms: checkResult.responseTimeMs,
        })
        .eq("id", monitoredUrl.id);

      await supabase.from("url_check_history").insert({
        monitored_url_id: monitoredUrl.id,
        status_code: checkResult.statusCode,
        response_time_ms: checkResult.responseTimeMs,
      });

      if (shouldAlert(checkResult.statusCode)) {
        const { data: existingAlerts } = await supabase
          .from("url_alerts")
          .select("id, screenshot_data")
          .eq("monitored_url_id", monitoredUrl.id)
          .not("screenshot_data", "is", null)
          .limit(1);

        let screenshotData: string | undefined;

        if (!existingAlerts || existingAlerts.length === 0) {
          const checkUrlFunctionUrl = `${supabaseUrl}/functions/v1/check-url`;

          try {
            const screenshotResponse = await fetch(checkUrlFunctionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ url: monitoredUrl.url }),
            });

            if (screenshotResponse.ok) {
              const data = await screenshotResponse.json();
              screenshotData = data.screenshotData;
            }
          } catch (err) {
            console.error('Failed to capture screenshot:', err);
          }
        }

        await supabase.from("url_alerts").insert({
          monitored_url_id: monitoredUrl.id,
          status_code: checkResult.statusCode,
          message: `URL returned status code ${checkResult.statusCode}`,
          screenshot_data: screenshotData,
          response_time_ms: checkResult.responseTimeMs,
          is_read: false,
        });
      }

      results.push({
        url: monitoredUrl.url,
        statusCode: checkResult.statusCode,
        responseTimeMs: checkResult.responseTimeMs,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Monitoring check completed",
        checked: results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in monitor-urls function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});