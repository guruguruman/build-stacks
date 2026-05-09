FROM mcr.microsoft.com/playwright:v1.52.0-noble

ARG CODEX_VERSION=0.128.0-alpha.1
ARG APM_VERSION=0.9.1
ARG AGENT_BROWSER_VERSION=0.25.3
ARG BUN_VERSION=1.3.10

ENV DEBIAN_FRONTEND=noninteractive
ENV BUN_INSTALL=/root/.bun
ENV PATH=/root/.bun/bin:/usr/local/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    jq \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g "@openai/codex@${CODEX_VERSION}" "agent-browser@${AGENT_BROWSER_VERSION}"
RUN python3 -m pip install --break-system-packages "apm-cli==${APM_VERSION}"
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"

RUN codex --version \
  && apm --version \
  && agent-browser --version \
  && bun --version

WORKDIR /work

COPY run-all-skills.mjs /usr/local/bin/product-skill-eval-runner.mjs

ENTRYPOINT ["node", "/usr/local/bin/product-skill-eval-runner.mjs"]
