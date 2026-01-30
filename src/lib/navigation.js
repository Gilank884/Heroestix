export const getBaseDomain = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return host;
    if (host.endsWith(".localhost")) return "localhost";
    // Change this to your actual production domain
    return "heroestix.com";
};

export const getSubdomainUrl = (sub, path = "") => {
    const { protocol, port } = window.location;
    const baseDomain = getBaseDomain();
    const portStr = port ? `:${port}` : "";

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (!sub) {
        return `${protocol}//${baseDomain}${portStr}${normalizedPath}`;
    }

    return `${protocol}//${sub}.${baseDomain}${portStr}${normalizedPath}`;
};
