import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

interface MyResponse<T> extends Response {
    data: T;
    request: RequestInit;
}

interface MyRequestInit extends RequestInit {
    params?: { [key: string]: string };
    logMode?: boolean;
}

interface MyPostInit extends MyRequestInit {
    json?: object;
    urlencoded?: { [key: string]: string };
}

export class MyFetch {
    public defaults: MyRequestInit;
    public jar: CookieJar;
    private fetchWithCookies;
    static createMobile() {
        return new MyFetch({
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1"
            }
        }, new CookieJar());
    }
    static createPC() {
        return new MyFetch({
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        }, new CookieJar());
    }


    constructor(defaults?: MyRequestInit, jar?: CookieJar) {
        this.defaults = defaults ?? {};;
        this.jar = jar ?? new CookieJar();
        // コンストラクタでfetchWithCookiesを初期化
        this.fetchWithCookies = fetchCookie(fetch, this.jar);
    }

    private async transformResponse(response: Response): Promise<any> {
        const contentType = response.headers.get('Content-Type');

        // レスポンスをクローン
        const clonedResponse = response.clone();

        try {
            // application/jsonの場合
            if (contentType?.includes('application/json')) {
                return await response.json();
            }
            // text/*の場合
            // if (contentType?.includes('text/')) {
            //     return await response.text();
            // }
            // application/x-www-form-urlencoded の場合
            if (contentType?.includes('application/x-www-form-urlencoded')) {
                const text = await response.text();
                const params = new URLSearchParams(text);
                return Object.fromEntries(params);
            }

            // その他の場合はJSONとして解析を試み、失敗したらテキストとして返す
            try {
                return await response.json();
            } catch {
                return await clonedResponse.text();
            }
        } catch (_) {
            return await clonedResponse.text();
        }
    }

    public async fetch<T = any>(input: RequestInfo, init?: MyRequestInit): Promise<MyResponse<T>> {
        const headers: HeadersInit = { ...this.defaults.headers, ...init?.headers };
        const mergedInit = {
            ...this.defaults,
            ...init,
            headers
        };

        const response = await this.fetchWithCookies(input, mergedInit) as MyResponse<T>;
        response.request = mergedInit;

        if (mergedInit.logMode) {
            console.log("-----------------------------------------------------------------");
            // リクエストヘッダーを取得
            const requestHeaders = new Request(input, mergedInit).headers;
            const requestHeadersObj = Object.fromEntries(requestHeaders.entries());
            const cookies = this.jar.getCookieStringSync(input.toString());
            if (cookies) {
                requestHeadersObj["Cookie"] = cookies;
            }

            console.log(`<request>\nurl: ${input}\nmethod: ${mergedInit.method}\nheaders: ${JSON.stringify(requestHeadersObj, null, 2)}\nbody: ${mergedInit.body}\n</request>`);
            
            // レスポンスヘッダーを取得
            const responseHeadersObj = Object.fromEntries(response.headers.entries());
            
            console.log(`<response>\nstatus: ${response.status}\nurl: ${response.url}\nheaders: ${JSON.stringify(responseHeadersObj, null, 2)}\nbody: ${JSON.stringify(response.data, null, 2)}\n</response>`);
            console.log("-----------------------------------------------------------------");
        }


        if (response.status < 200 || response.status >= 300) {
            const errorMessage = typeof response.data === 'object'
                ? JSON.stringify(await response.json())
                : await response.text();
            throw new Error(`HTTP error! status: ${response.status}\nfinalURL: ${response.url}\nresponse: ${errorMessage}`);
        }
        return response;
    }

    public async get<T = any>(url: string, init?: MyRequestInit): Promise<MyResponse<T>> {
        const queryString = new URLSearchParams(init?.params).toString();
        url = queryString ? `${url}?${queryString}` : url;
        const response = await this.fetch<T>(url, { ...init, method: 'GET' });
        // response.data = await this.transformResponse(response);
        return response;
    }

    public async post<T = any>(url: string, init?: MyPostInit): Promise<MyResponse<T>> {
        if (init?.json && init?.urlencoded) {
            throw new Error('json と urlencoded は同時に使用できません。どちらか一方を選択してください。');
        }

        let headers: HeadersInit = { ...init?.headers };
        let body: string | undefined;

        if (init?.json) {
            headers = {
                ...headers,
                'Content-Type': 'application/json'
            };
            body = JSON.stringify(init.json);
        } else if (init?.urlencoded) {
            headers = {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            body = new URLSearchParams(init.urlencoded).toString();
        }

        const queryString = new URLSearchParams(init?.params).toString();
        url = queryString ? `${url}?${queryString}` : url;

        const response = await this.fetch<T>(url, {
            ...init,
            headers,
            body,
            method: 'POST'
        });
        response.data = await this.transformResponse(response);
        return response;
    }

    public changeCookieJar(jar: CookieJar) {
        this.jar = jar;
        this.fetchWithCookies = fetchCookie(fetch, this.jar);
    }
}
