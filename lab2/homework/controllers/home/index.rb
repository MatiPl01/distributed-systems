require './utils/renderer'

module Controllers
module Home

  class Index
    def call(env)
      Utils::Renderer.render_erb('./views/input.html.erb')
    end
  end

end
end
