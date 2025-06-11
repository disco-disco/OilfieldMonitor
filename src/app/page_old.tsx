import { Activity, Droplets, Gauge, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Oil Well Monitor</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Real-time Well Parameters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6">
            Build the
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Future </span>
            Today
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Create stunning, modern websites with cutting-edge technology. Fast, secure, and beautifully designed for the modern web.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              Start Building
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-600 px-8 py-4 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-slate-600 dark:text-slate-300">Built with Next.js 15 and optimized for maximum performance and speed.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Secure & Reliable</h3>
            <p className="text-slate-600 dark:text-slate-300">Enterprise-grade security with modern best practices and reliable infrastructure.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">User Focused</h3>
            <p className="text-slate-600 dark:text-slate-300">Designed with user experience in mind, responsive and accessible on all devices.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white dark:bg-slate-800 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                About Our Platform
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                We're passionate about creating exceptional digital experiences. Our platform combines cutting-edge technology with intuitive design to help businesses thrive in the digital age.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-slate-600 dark:text-slate-300">Trusted by 1000+ clients</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-8 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-slate-600 dark:text-slate-300 mb-4">Uptime Guarantee</div>
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-slate-600 dark:text-slate-300">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive solutions tailored to meet your business needs and drive growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Web Development", description: "Custom websites built with modern technologies" },
              { title: "Mobile Apps", description: "Native and cross-platform mobile applications" },
              { title: "UI/UX Design", description: "Beautiful, user-friendly interface designs" },
              { title: "E-commerce", description: "Complete online store solutions and integrations" },
              { title: "SEO Optimization", description: "Improve your search engine rankings and visibility" },
              { title: "Maintenance", description: "Ongoing support and maintenance for your projects" }
            ].map((service, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{service.description}</p>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                  Learn More <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Let's discuss your project and bring your vision to life.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <textarea
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              ModernSite
            </div>
            <p className="mb-4">Building the future, one website at a time.</p>
            <div className="text-sm text-slate-400">
              © 2025 ModernSite. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
