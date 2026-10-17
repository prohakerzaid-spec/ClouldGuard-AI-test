import { useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, BadgeCheck,
  Check, CheckCircle2, ChevronRight, Circle, Clock3, Cloud, Code2,
  ExternalLink, FileCode2, GitBranch, GitCommitHorizontal, GitPullRequest,
  LockKeyhole, Play, RefreshCw, Server, Shield, ShieldAlert,
  ShieldCheck, Terminal, X,
} from 'lucide-react';

type Stage = 'idle' | 'running' | 'ready' | 'approved' | 'rejected';
type LogLine = { text: string; tone: 'info' | 'warn' | 'success'; time: string; id: number };

const logMessages: Array<{ text: string; tone: LogLine['tone'] }> = [
  { text: 'PR Webhook Received: inspecting main.tf...', tone: 'info' },
  { text: 'Security Check: Detected AWS-S3-001 (Public Access Enabled).', tone: 'warn' },
  { text: 'Cost Calculation: Over-provisioned t3.2xlarge detected. Estimated Savings: $240/mo.', tone: 'info' },
  { text: 'Generating Terraform Patch & Running Syntax Validation... SUCCESS.', tone: 'success' },
];

const beforeLines = [
  ['neutral', 'resource "aws_s3_bucket" "data_store" {'],
  ['neutral', '  bucket = "company-public-data"'],
  ['removed', '  # VULNERABILITY: bucket is publicly readable'],
  ['removed', '  acl    = "public-read"'],
  ['neutral', '}'],
  ['neutral', ''],
  ['neutral', 'resource "aws_instance" "app_server" {'],
  ['neutral', '  ami           = "ami-0c55b159cbfafe1f0"'],
  ['removed', '  # COST RISK: oversized instance for this workload'],
  ['removed', '  instance_type = "t3.2xlarge"'],
  ['neutral', '}'],
] as const;

const afterLines = [
  ['neutral', 'resource "aws_s3_bucket" "data_store" {'],
  ['neutral', '  bucket = "company-public-data"'],
  ['added', '  # Restrict access to private ACLs'],
  ['added', '  acl    = "private"'],
  ['neutral', '}'],
  ['neutral', ''],
  ['added', 'resource "aws_s3_bucket_public_access_block" "block" {'],
  ['added', '  bucket = aws_s3_bucket.data_store.id'],
  ['added', '  block_public_acls = true'],
  ['added', '}'],
  ['neutral', ''],
  ['neutral', 'resource "aws_instance" "app_server" {'],
  ['neutral', '  ami           = "ami-0c55b159cbfafe1f0"'],
  ['added', '  # Optimize capacity for the workload'],
  ['added', '  instance_type = "t3.medium"'],
  ['neutral', '}'],
] as const;

function clockStamp() {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
}

function App() {
  const [stage, setStage] = useState<Stage>('idle');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [activeTab, setActiveTab] = useState<'split' | 'before' | 'after'>('split');
  const timeoutIds = useRef<number[]>([]);
  const sequenceId = useRef(0);

  useEffect(() => () => timeoutIds.current.forEach(window.clearTimeout), []);

  const runSimulation = () => {
    timeoutIds.current.forEach(window.clearTimeout);
    timeoutIds.current = [];
    const thisSequence = ++sequenceId.current;
    setLogs([]);
    setStage('running');
    logMessages.forEach((message, index) => {
      const timer = window.setTimeout(() => {
        if (sequenceId.current !== thisSequence) return;
        setLogs((current) => [...current, { ...message, time: clockStamp(), id: thisSequence * 10 + index }]);
        if (index === logMessages.length - 1) {
          const finishTimer = window.setTimeout(() => {
            if (sequenceId.current !== thisSequence) return;
            setStage('ready');
          }, 420);
          timeoutIds.current.push(finishTimer);
        }
      }, 720 + index * 1050);
      timeoutIds.current.push(timer);
    });
  };

  const approve = () => {
    if (stage === 'ready') setStage('approved');
  };
  const reject = () => {
    if (stage === 'ready') setStage('rejected');
  };

  const status = {
    idle: { label: 'Awaiting simulation', className: 'pending', icon: <Circle size={14} /> },
    running: { label: 'Analysis in progress', className: 'running', icon: <RefreshCw size={14} className="spin" /> },
    ready: { label: 'Ready for human review', className: 'ready', icon: <ShieldCheck size={15} /> },
    approved: { label: 'PR #42 Successfully Merged & Patched', className: 'success', icon: <CheckCircle2 size={15} /> },
    rejected: { label: 'Patch rejected · original preserved', className: 'rejected', icon: <X size={15} /> },
  }[stage];

  const approvalText = {
    idle: ['Human approval required', 'Run the local simulation targeting tesla-org/cloud-infra-sandbox. Approval simulates a GitHub commit; it does not make a real GitHub commit.'],
    running: ['Review gate locked', 'The analysis is still running. Approval controls unlock only after syntax validation passes.'],
    ready: ['Your review is the final gate', 'This is a simulation targeting tesla-org/cloud-infra-sandbox. Approve to simulate a GitHub commit and merge; no real GitHub commit will be made.'],
    approved: ['Sandbox patch committed', 'Simulated GitHub action complete for tesla-org/cloud-infra-sandbox · PR #42. No real GitHub commit was made; the original Terraform is updated in this demo state.'],
    rejected: ['Patch rejected', 'No changes were committed. The original Terraform configuration remains unchanged in the sandbox.'],
  }[stage];

  const hasPatch = stage === 'ready' || stage === 'approved' || stage === 'rejected';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" data-testid="brand-cloudguard">
          <span className="brand-mark"><Shield size={17} strokeWidth={2.1} /></span>
          <span>cloudguard<span style={{ color: '#58d9b2' }}>.</span>ai</span>
        </div>
        <div className="topmeta">
          <span className="top-date">SECURITY OPERATIONS / SANDBOX</span>
          <span className="live-pill"><i className="live-dot" /> Local simulation</span>
        </div>
      </header>

      <main className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">Infrastructure change review</div>
              <h1 className="display" data-testid="text-product-heading" style={{ maxWidth: 760, fontSize: 'clamp(25px, 3vw, 34px)' }}>CloudGuard AI — Autonomous IaC Security &amp; Cost Remediation Agent</h1>
            <p>See the security posture and cost impact before a Terraform change ships.</p>
          </div>
          <div className="repo-chip" data-testid="text-repository">
            <GitBranch size={14} /> tesla-org / cloud-infra-sandbox <ChevronRight size={13} /> main
          </div>
        </div>

        <section className="overview-grid" aria-label="Pull request overview">
          <article className="panel">
            <div className="panel-head">
              <div className="panel-title"><GitPullRequest size={16} /> Incoming pull request</div>
              <span className="panel-kicker">SIMULATED WEBHOOK</span>
            </div>
            <div className="pr-summary">
              <div className="pr-title-row">
                <div>
                  <h2 className="pr-title">Harden public data store & right-size app server</h2>
                  <p className="pr-subtitle">Infrastructure updates from the sandbox repository</p>
                </div>
                <span className="pr-id" data-testid="text-pr-number">#42</span>
              </div>
              <div className="pr-meta">
                <span><GitBranch size={13} /> <b style={{ color: '#c3cdd3', fontWeight: 500 }}>feature/harden-storage</b> → main</span>
                <span><FileCode2 size={13} /> main.tf</span>
                <span><Clock3 size={13} /> Terraform change</span>
              </div>
            </div>
            <div className="status-line">
              <div className={`state-label ${status.className}`} data-testid="status-pr-state">{status.icon}<span>{status.label}</span></div>
              <button type="button" className="sim-button" onClick={runSimulation} disabled={stage === 'running'} data-testid="button-simulate-pr">
                {stage === 'running' ? <RefreshCw size={14} className="spin" /> : stage === 'approved' || stage === 'rejected' ? <RefreshCw size={14} /> : <Play size={13} fill="currentColor" />}
                {stage === 'running' ? 'Analyzing pull request…' : 'Simulate Incoming Pull Request #42'}
              </button>
            </div>
          </article>

          <article className="panel metric-panel">
            <div className="metric-top"><span>Estimated Monthly Savings</span><ArrowDownRight size={16} color="#56d8b1" /></div>
            <div className="metric-main">
              <span className="metric-value" data-testid="text-estimated-savings">$240.00</span>
              <span className="metric-unit">/ month</span>
            </div>
            <div className="metric-note">Projected from right-sizing the app server from <span className="mono">t3.2xlarge</span> to <span className="mono">t3.medium</span>.</div>
            <div className="metric-breakdown"><Server size={12} /> INSTANCE RIGHT-SIZE <span>·</span> <strong>−$240 / mo</strong></div>
            <div className="metric-divider" />
            <div className="verified-row">
              <div className="left"><BadgeCheck size={14} color={hasPatch ? '#58d9b2' : '#7b8994'} /> Verified Monthly Savings</div>
              <div className="verified-value" data-testid="text-verified-savings" style={{ color: hasPatch ? '#5ce0b4' : '#8997a1' }}>{hasPatch ? '$240.00 / month' : 'Awaiting validation'}</div>
            </div>
            <div className="verified-caption">{hasPatch ? 'Demo-verified by simulated validation. This is not an actual cloud bill.' : 'Available after simulated syntax validation passes. Not an actual cloud bill.'}</div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel">
            <div className="panel-head">
              <div className="panel-title"><ShieldAlert size={16} /> Security finding</div>
              <span className="panel-kicker">1 FINDING</span>
            </div>
            <div className="finding-body">
              <h3 className="finding-name">AWS-S3-001: Public Read Access Enabled on S3 Bucket</h3>
              <div className="finding-labels">
                <span className="tag high" data-testid="text-finding-severity"><AlertTriangle size={10} style={{ verticalAlign: '-1px', marginRight: 5 }} />HIGH SEVERITY</span>
                <span className="tag" data-testid="text-finding-cwe">CWE-284</span>
                <span className="tag">aws_s3_bucket.data_store</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: 13 }}>
                <span className="panel-kicker">SOURCE EVIDENCE</span>
                <code className="mono" data-testid="text-finding-evidence" style={{ color: '#f09a85', background: '#2b201f', border: '1px solid #50332f', borderRadius: 5, padding: '5px 8px', fontSize: 11 }}>acl = &quot;public-read&quot;</code>
              </div>
              <p className="finding-detail">The bucket grants public read access through its ACL. The proposed configuration switches to private access and explicitly blocks public ACLs.</p>
            </div>
          </article>

          <article className="panel terminal">
            <div className="panel-head">
              <div className="panel-title"><Terminal size={16} /> Analysis activity</div>
              <span className="panel-kicker">{stage === 'running' ? 'PROCESSING' : stage === 'ready' || stage === 'approved' ? 'COMPLETE' : stage === 'rejected' ? 'REJECTED' : 'AWAITING EVENT'}</span>
            </div>
            <div className="terminal-body" data-testid="region-analysis-log" aria-live="polite">
              {logs.length === 0 ? (
                <div className="terminal-empty">No events yet. Simulate the incoming pull request to begin.</div>
              ) : (
                <div className="terminal-lines">
                  {logs.map((entry) => (
                    <div className={`term-entry ${entry.tone}`} key={entry.id} data-testid={`text-analysis-event-${entry.id}`}>
                      <span className="term-time">{entry.time}</span><span>{entry.text}</span>
                    </div>
                  ))}
                  {stage === 'running' && <span className="cursor" aria-label="Analysis in progress" />}
                  {(stage === 'ready' || stage === 'approved' || stage === 'rejected') && <div className="term-entry success" data-testid="text-syntax-validation"><span className="term-time">{clockStamp()}</span><span>Syntax Validation: PASSED</span></div>}
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="panel code-panel" aria-label="Terraform patch preview">
          <div className="code-header">
            <div className="code-header-left"><Code2 size={16} color="#8b9ba5" /> Terraform patch <span className="panel-kicker" style={{ marginLeft: 3 }} data-testid="text-patch-mode">{stage === 'approved' ? 'COMMITTED IN DEMO' : 'PREVIEW ONLY'}</span></div>
            <div className="code-file"><FileCode2 size={13} /> main.tf <span style={{ color: '#596670' }}>·</span> HCL</div>
            <div className="code-tabs" role="tablist" aria-label="Patch view">
              {(['split', 'before', 'after'] as const).map((tab) => (
                <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={`code-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} data-testid={`tab-patch-${tab}`}>
                  {tab === 'split' ? 'Diff' : tab === 'before' ? 'Before' : 'Proposed'}
                </button>
              ))}
            </div>
          </div>
          <div className={`diff-cols ${activeTab === 'before' || activeTab === 'after' ? 'single' : ''}`}>
            {activeTab !== 'after' && <DiffSide label="ORIGINAL CONFIGURATION" tone="before" lines={beforeLines} />}
            {activeTab !== 'before' && <DiffSide label="PROPOSED PATCH" tone="after" lines={afterLines} />}
          </div>
          <div className="patch-note">
            <LockKeyhole size={13} />
            <span>{stage === 'approved' ? 'Patch committed in the local simulation after human approval.' : 'Preview only. No repository or cloud resources change until you explicitly approve the validated patch.'}</span>
          </div>
        </section>

        <section className={`approval ${status.className}`} aria-label="Human approval gate">
          <div className="approval-copy">
            <div className="approval-icon">{stage === 'approved' ? <Check size={17} /> : stage === 'rejected' ? <X size={17} /> : stage === 'ready' ? <ShieldCheck size={17} /> : <LockKeyhole size={16} />}</div>
            <div>
              <h3 className="approval-title">{approvalText[0]}</h3>
              <p className="approval-desc">{approvalText[1]}</p>
            </div>
          </div>
          <div className="approval-actions">
            {stage === 'approved' ? (
              <div className="state-label success" data-testid="status-merge-success"><CheckCircle2 size={15} /><span>PR #42 Successfully Merged & Patched</span></div>
            ) : stage === 'rejected' ? (
              <div className="state-label rejected" data-testid="status-patch-rejected"><X size={15} /><span>Original configuration preserved</span></div>
            ) : (
              <>
                <button type="button" className="action-button reject-button" onClick={reject} disabled={!hasPatch || stage !== 'ready'} data-testid="button-reject-patch">
                  <X size={14} /> Reject Patch
                </button>
                <button type="button" className="action-button approve-button" onClick={approve} disabled={stage !== 'ready'} data-testid="button-approve-patch">
                  <GitCommitHorizontal size={15} /> Approve &amp; Commit Patch to GitHub
                </button>
              </>
            )}
          </div>
        </section>

        <div className="footnote">
          <span><Activity size={12} /> LOCAL DEMO · NO EXTERNAL SERVICES CONNECTED</span>
          <span><Cloud size={12} /> Simulated GitHub context <ExternalLink size={10} /></span>
        </div>
      </main>
    </div>
  );
}

function DiffSide({ label, tone, lines }: { label: string; tone: 'before' | 'after'; lines: readonly (readonly [string, string])[] }) {
  return (
    <div className="diff-side">
      <div className="diff-label"><span className={tone}>{label}</span><span>{tone === 'before' ? 'main.tf' : 'proposed · not applied'}</span></div>
      <div className="code-block">
        {lines.map(([kind, line], index) => (
          <div className={`code-line ${kind}`} key={`${tone}-${index}`}>
            <span className="line-no">{index + 1}</span><span>{kind === 'removed' ? '− ' : kind === 'added' ? '+ ' : '  '}{line || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
