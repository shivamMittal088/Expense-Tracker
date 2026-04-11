const NavBar = () => {
  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        <div className="w-full px-4 py-3">
          <div className="relative rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute top-0 left-[12%] right-[12%] h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />

            <div className="relative px-3 h-14 flex items-center justify-between">
              {/* Left side - App Name */}
              <div className="flex items-center gap-3 relative">
                {/* Logo */}
                <a
                  href="/"
                  className="group flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                    <img 
                      src="/favicon.svg" 
                      alt="TrackExpense" 
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[13px] uppercase tracking-[0.28em] text-white/50">Track</span>
                    <span className="text-[15px] font-semibold tracking-wide text-white">Expense</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;