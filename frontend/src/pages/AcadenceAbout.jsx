import React from "react";

const AcadenceAbout = () => {
  return (
    <div className="bg-gray-50 font-['Poppins']">
      {/* Navigation */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <a href="#" className="flex items-center text-primary font-bold text-xl">
            <i className="fas fa-graduation-cap mr-2"></i>Acadence
          </a>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-primary">Home</a>
            <a href="#" className="text-primary font-medium">About</a>
            <a href="#" className="text-gray-600 hover:text-primary">Courses</a>
            <a href="#" className="text-gray-600 hover:text-primary">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-primary">Contact</a>
            <a href="#" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition">Sign Up</a>
          </div>
          <div className="md:hidden">
            <button className="outline-none mobile-menu-button">
              <svg className="w-6 h-6 text-gray-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 gradient-bg text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Transforming Education Through Innovation</h1>
          <p className="text-xl mb-10 opacity-90">Acadence is redefining online learning with cutting-edge technology and personalized educational experiences.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="bg-white text-blue-500 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition">Get Started</a>
            <a href="#" className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:bg-opacity-10 transition">View Courses</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">About Acadence</h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
            <p className="mt-6 text-gray-600 max-w-3xl mx-auto">Acadence is a next-generation learning platform designed to help students and professionals achieve their educational goals through adaptive technology and engaging content.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" alt="Acadence Learning Platform" className="rounded-lg shadow-xl" />
            </div>
            <div className="md:w-1/2 md:pl-12">
              <h3 className="text-2xl font-bold text-dark mb-6">Our Mission</h3>
              <p className="text-gray-600 mb-6">We believe that education should be accessible, engaging, and tailored to individual learning styles. Our mission is to empower learners worldwide by providing a platform that adapts to their unique needs and pace.</p>
              <p className="text-gray-600 mb-6">With Acadence, students can enjoy a personalized learning journey that maximizes their potential and helps them achieve academic and professional success.</p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-primary mr-3"></i>
                  <span className="text-gray-600">Personalized learning paths</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-primary mr-3"></i>
                  <span className="text-gray-600">Interactive content and assessments</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-primary mr-3"></i>
                  <span className="text-gray-600">Real-time progress tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-light">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">Why Choose Acadence?</h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
            <p className="mt-6 text-gray-600 max-w-3xl mx-auto">Discover the features that make Acadence the preferred learning platform for thousands of students and educators worldwide.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-primary text-2xl mb-6">
                <i className="fas fa-brain"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Adaptive Learning</h3>
              <p className="text-gray-600">Our AI-powered system adjusts content difficulty based on your performance, ensuring optimal challenge and growth.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-pink-100 rounded-lg flex items-center justify-center text-accent text-2xl mb-6">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Progress Analytics</h3>
              <p className="text-gray-600">Track your learning journey with detailed analytics and insights that help you understand your strengths and areas for improvement.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center text-secondary text-2xl mb-6">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Collaborative Learning</h3>
              <p className="text-gray-600">Connect with peers and instructors through discussion forums, group projects, and live sessions.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-2xl mb-6">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Mobile Accessibility</h3>
              <p className="text-gray-600">Learn on the go with our mobile app, available for both iOS and Android devices.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 text-2xl mb-6">
                <i className="fas fa-certificate"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Certification</h3>
              <p className="text-gray-600">Earn recognized certificates upon course completion to showcase your skills to employers.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md feature-card transition">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-2xl mb-6">
                <i className="fas fa-book-open"></i>
              </div>
              <h3 className="text-xl font-bold text-dark mb-4">Rich Content Library</h3>
              <p className="text-gray-600">Access thousands of courses, videos, articles, and practice exercises across diverse subjects.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 gradient-bg text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg text-center shadow-lg hover:shadow-xl transition-all duration-300">
  <div className="text-4xl font-bold mb-2 text-white">50,000+</div>
  <div className="text-lg text-gray-200">Active Learners</div>
</div>

            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg text-center shadow-lg hover:shadow-xl transition-all duration-300">
  <div className="text-4xl font-bold mb-2 text-white">1,200+</div>
  <div className="text-lg text-gray-200">Expert Instructors</div>
</div>

            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg text-center shadow-lg hover:shadow-xl transition-all duration-300">
  <div className="text-4xl font-bold mb-2 text-white">5,000+</div>
  <div className="text-lg text-gray-200">Courses Available</div>
</div>

            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg text-center shadow-lg hover:shadow-xl transition-all duration-300">
  <div className="text-4xl font-bold mb-2 text-white">95%</div>
  <div className="text-lg text-gray-200">Satisfaction Rate</div>
</div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">What Our Students Say</h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
            <p className="mt-6 text-gray-600 max-w-3xl mx-auto">Hear from students who have transformed their learning experience with Acadence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-light p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"Acadence completely changed how I learn. The adaptive technology knows exactly where I need help and provides the right content at the right time."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Sarah Johnson" />
                </div>
                <div>
                  <h4 className="font-bold text-dark">Sarah Johnson</h4>
                  <p className="text-gray-500">Computer Science Student</p>
                </div>
              </div>
            </div>
            
            <div className="bg-light p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"The progress analytics helped me identify my weak areas and focus my studies more effectively. I've improved my grades significantly since using Acadence."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="David Chen" />
                </div>
                <div>
                  <h4 className="font-bold text-dark">David Chen</h4>
                  <p className="text-gray-500">Engineering Student</p>
                </div>
              </div>
            </div>
            
            <div className="bg-light p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-6">"As a working professional, the mobile accessibility allows me to learn during my commute. The bite-sized lessons are perfect for busy schedules."</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Maria Rodriguez" />
                </div>
                <div>
                  <h4 className="font-bold text-dark">Maria Rodriguez</h4>
                  <p className="text-gray-500">Marketing Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 gradient-bg text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl mb-10 opacity-90">Join thousands of students already achieving their goals with Acadence.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="bg-white text-blue-500 px-8 py-4 rounded-md font-medium hover:bg-gray-100 transition text-lg">Get Started for Free</a>
            <a href="#" className="border-2 border-white text-white px-8 py-4 rounded-md font-medium hover:bg-white hover:bg-opacity-10 transition text-lg">Schedule a Demo</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <i className="fas fa-graduation-cap mr-2"></i>Acadence
              </h3>
              <p className="text-gray-400 mb-6">Transforming education through innovative technology and personalized learning experiences.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Courses</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-map-marker-alt mr-3 mt-1 text-primary"></i>
                  <span className="text-gray-400">123 Education Street, Learning City, 54321</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone-alt mr-3 text-primary"></i>
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope mr-3 text-primary"></i>
                  <span className="text-gray-400">info@acadence.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Acadence. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .gradient-bg {
          background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .stats-card {
          transition: all 0.3s ease;
        }
        
        .stats-card:hover {
          transform: scale(1.05);
        }
        
        .font-['Poppins'] {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      
      {/* Add Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Add Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  );
};

export default AcadenceAbout;